import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CareRequest,
  CaregiverCandidate,
  ScoredMatch,
  MatchingOptions,
  MatchingMetrics,
  MatchCompletedPayload,
  IAIScorer,
  MatchingEventType,
} from '../interfaces/matching.interfaces';
import { CaregiverMatch } from '../entities/caregiver-match.entity';
import { MatchingMetric } from '../entities/matching-metrics.entity';
import { CandidateFetcherService } from './candidate-fetcher.service';
import { MatchingMetricsService } from './matching-metrics.service';
import { KafkaProducerService } from './kafka-producer.service';
import { RedisGeoService } from './redis-geo.service';

/**
 * Matching Orchestrator Service
 * 
 * Main orchestrator for the AI matching process.
 * Coordinates the entire matching workflow from candidate selection
 * through AI scoring to result persistence and event publishing.
 * 
 * Uber-grade features:
 * - Temporal workflow integration (optional)
 * - Kafka event streaming
 * - Redis geo-indexing
 * - Performance SLA tracking
 */
@Injectable()
export class MatchingOrchestratorService {
  private readonly logger = new Logger(MatchingOrchestratorService.name);
  
  // SLA configuration
  private readonly SLA_TARGET_MS = parseInt(process.env.MATCHING_SLA_TARGET_MS || '3000', 10);
  private readonly MIN_SCORE_THRESHOLD = parseInt(process.env.MATCHING_MIN_SCORE || '60', 10);
  private readonly MAX_RESULTS = parseInt(process.env.MATCHING_MAX_RESULTS || '20', 10);
  
  constructor(
    @InjectRepository(CaregiverMatch)
    private readonly matchRepo: Repository<CaregiverMatch>,
    @InjectRepository(MatchingMetric)
    private readonly metricsRepo: Repository<MatchingMetric>,
    private readonly candidateFetcher: CandidateFetcherService,
    @Inject('IAIScorer')
    private readonly aiScorer: IAIScorer,
    private readonly metricsService: MatchingMetricsService,
    @Optional() private readonly kafkaProducer?: KafkaProducerService,
    @Optional() private readonly redisGeo?: RedisGeoService,
  ) {}
  
  /**
   * Process a care request through the matching pipeline
   */
  async processCareRequest(
    careRequest: CareRequest,
    options: MatchingOptions = {}
  ): Promise<ScoredMatch[]> {
    const startTime = Date.now();
    const metrics: Partial<MatchingMetrics> = {
      careRequestId: careRequest.id,
      timestamp: new Date(),
      errors: [],
    };
    
    try {
      this.logger.log(`Starting AI matching for care request: ${careRequest.id}`);
      
      // Publish matching started event
      await this.publishEvent(MatchingEventType.MATCHING_STARTED, {
        careRequestId: careRequest.id,
        timestamp: new Date(),
      });
      
      // 1. Get candidate pool using Redis Geo when available
      let candidates = await this.getCandidatePool(careRequest, options);
      metrics.candidateCount = candidates.length;
      
      this.logger.log(`Found ${candidates.length} eligible candidates`);
      
      // Publish progress event
      await this.publishEvent(MatchingEventType.MATCHING_PROGRESS, {
        careRequestId: careRequest.id,
        phase: 'candidates_found',
        candidateCount: candidates.length,
      });
      
      if (candidates.length === 0) {
        // Retry with relaxed constraints
        candidates = await this.getCandidatePoolRelaxed(careRequest);
        metrics.candidateCount = candidates.length;
        
        if (candidates.length === 0) {
          this.logger.warn(`No eligible candidates for care request ${careRequest.id}`);
          await this.handleNoMatches(careRequest.id);
          return [];
        }
      }
      
      // 2. Score candidates using AI
      this.logger.debug(`Scoring candidates with AI engine...`);
      const scoredMatches = await this.aiScorer.scoreMatches(careRequest, candidates);
      
      // 3. Filter and rank results
      const qualifiedMatches = this.filterQualifiedMatches(scoredMatches);
      metrics.matchCount = qualifiedMatches.length;
      
      if (qualifiedMatches.length > 0) {
        metrics.topScore = qualifiedMatches[0].score;
        metrics.averageScore = this.calculateAverageScore(qualifiedMatches);
      }
      
      this.logger.log(`Generated ${qualifiedMatches.length} qualified matches`);
      
      // 4. Persist results
      await this.saveMatches(careRequest.id, qualifiedMatches);
      
      // 5. Record metrics
      metrics.duration = Date.now() - startTime;
      metrics.scorerVersion = this.aiScorer.getVersion();
      metrics.slaMet = metrics.duration <= this.SLA_TARGET_MS;
      await this.recordMetrics(metrics as MatchingMetrics);
      
      // 6. Publish completion event
      await this.publishMatchCompleted(careRequest.id, qualifiedMatches, metrics as MatchingMetrics);
      
      this.logger.log(`AI matching completed for care request ${careRequest.id} in ${metrics.duration}ms (SLA: ${metrics.slaMet ? 'MET' : 'MISSED'})`);
      
      return qualifiedMatches;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI matching failed for care request ${careRequest.id}: ${errorMessage}`, error);
      
      metrics.errors?.push(errorMessage);
      metrics.duration = Date.now() - startTime;
      
      // Record failed metrics
      await this.recordMetrics(metrics as MatchingMetrics);
      
      // Publish failure event
      await this.publishEvent(MatchingEventType.MATCHING_FAILED, {
        careRequestId: careRequest.id,
        error: errorMessage,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }
  
  /**
   * Get candidate pool using Redis Geo for fast geospatial queries
   */
  private async getCandidatePool(
    careRequest: CareRequest,
    options: MatchingOptions
  ): Promise<CaregiverCandidate[]> {
    const maxDistance = options.maxDistanceKm ?? 50;
    const maxCandidates = options.useCache ? 200 : 500;
    const skillsRequired = options.skillsRequired ?? true;
    
    // Try Redis Geo first for ultra-fast proximity search
    if (this.redisGeo && careRequest.location?.latitude && careRequest.location?.longitude) {
      try {
        const nearbyCaregiverIds = await this.redisGeo.findNearbyCaregivers(
          careRequest.location.latitude,
          careRequest.location.longitude,
          { radiusKm: maxDistance, limit: maxCandidates, activeOnly: true, withDistances: true }
        );
        
        if (nearbyCaregiverIds.length > 0) {
          this.logger.debug(`Redis Geo found ${nearbyCaregiverIds.length} nearby caregivers`);
          return this.candidateFetcher.getCandidatesByIds(
            nearbyCaregiverIds.map(c => c.caregiverId),
            careRequest,
            { skillsRequired }
          );
        }
      } catch (error) {
        this.logger.warn(`Redis Geo lookup failed, falling back to database: ${error}`);
      }
    }
    
    // Fallback to database-based candidate fetching
    return this.candidateFetcher.getCandidates(careRequest, {
      maxCandidates,
      maxDistanceKm: maxDistance,
      skillsRequired,
    });
  }
  
  /**
   * Get candidate pool with relaxed constraints (fallback)
   */
  private async getCandidatePoolRelaxed(
    careRequest: CareRequest
  ): Promise<CaregiverCandidate[]> {
    this.logger.warn(`Retrying with relaxed filters for care request ${careRequest.id}`);
    
    return this.candidateFetcher.getCandidates(careRequest, {
      maxCandidates: 1000,
      maxDistanceKm: 5000,
      skillsRequired: false,
      includeInactive: true,
      relaxedMode: true,
    });
  }
  
  /**
   * Filter matches based on minimum quality thresholds
   */
  private filterQualifiedMatches(matches: ScoredMatch[]): ScoredMatch[] {
    return matches
      .filter(match => match.score >= this.MIN_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.MAX_RESULTS)
      .map((match, index) => ({
        ...match,
        rank: index + 1,
      }));
  }
  
  /**
   * Save matches to database
   */
  private async saveMatches(careRequestId: string, matches: ScoredMatch[]): Promise<void> {
    const entities = matches.map(match => this.matchRepo.create({
      careRequestId,
      caregiverId: match.candidateId,
      score: match.score,
      rank: match.rank,
      confidence: match.confidence,
      status: 'suggested',
      scoreBreakdown: match.breakdown,
      insights: match.insights,
      scorerVersion: this.aiScorer.getVersion(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }));
    
    await this.matchRepo.save(entities);
    this.logger.debug(`Saved ${entities.length} matches for care request ${careRequestId}`);
  }
  
  /**
   * Record matching metrics
   */
  private async recordMetrics(metrics: MatchingMetrics): Promise<void> {
    try {
      const entity = this.metricsRepo.create({
        careRequestId: metrics.careRequestId,
        timestamp: metrics.timestamp,
        duration: metrics.duration,
        candidateCount: metrics.candidateCount,
        matchCount: metrics.matchCount,
        topScore: metrics.topScore,
        averageScore: metrics.averageScore,
        scorerVersion: metrics.scorerVersion,
        cacheHit: metrics.cacheHit || false,
        mlModelUsed: metrics.mlModelUsed || false,
        mlModelVersion: metrics.mlModelVersion,
        region: metrics.region,
        h3CellId: metrics.h3CellId,
        errors: metrics.errors,
        slaMet: metrics.duration <= this.SLA_TARGET_MS,
        slaTargetMs: this.SLA_TARGET_MS,
      });
      
      await this.metricsRepo.save(entity);
      
      // Also record to metrics service for real-time monitoring
      await this.metricsService.recordMetrics(metrics);
    } catch (error) {
      this.logger.error(`Failed to record metrics: ${error}`);
    }
  }
  
  /**
   * Calculate average match score
   */
  private calculateAverageScore(matches: ScoredMatch[]): number {
    if (matches.length === 0) return 0;
    const sum = matches.reduce((acc, match) => acc + match.score, 0);
    return Math.round(sum / matches.length);
  }
  
  /**
   * Handle case when no matches are found
   */
  private async handleNoMatches(careRequestId: string): Promise<void> {
    this.logger.log(`No matches found for care request ${careRequestId}`);
    
    // Publish empty match result
    const emptyPayload: MatchCompletedPayload = {
      careRequestId,
      matchCount: 0,
      topMatches: [],
      metrics: {
        careRequestId,
        candidateCount: 0,
        matchCount: 0,
        topScore: 0,
        averageScore: 0,
        duration: 0,
        scorerVersion: this.aiScorer.getVersion(),
        timestamp: new Date(),
        errors: [],
      },
    };
    
    await this.publishEvent(MatchingEventType.MATCHES_READY, emptyPayload);
  }
  
  /**
   * Publish match completed event
   */
  private async publishMatchCompleted(
    careRequestId: string,
    matches: ScoredMatch[],
    metrics: MatchingMetrics
  ): Promise<void> {
    const payload: MatchCompletedPayload = {
      careRequestId,
      matchCount: matches.length,
      topMatches: matches.slice(0, 5).map(m => ({
        candidateId: m.candidateId,
        score: m.score,
      })),
      metrics,
    };
    
    await this.publishEvent(MatchingEventType.MATCHES_READY, payload);
    await this.publishEvent(MatchingEventType.MATCHING_COMPLETED, payload);
  }
  
  /**
   * Publish event to Kafka
   */
  private async publishEvent(eventType: MatchingEventType, payload: any): Promise<void> {
    if (!this.kafkaProducer) {
      this.logger.debug(`Kafka not available, skipping event: ${eventType}`);
      return;
    }
    
    try {
      await this.kafkaProducer.publish(eventType, payload);
      this.logger.debug(`Published event: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}: ${error}`);
    }
  }
  
  /**
   * Get matches for a care request
   */
  async getMatches(careRequestId: string, options?: { limit?: number; minScore?: number }): Promise<ScoredMatch[]> {
    const query = this.matchRepo
      .createQueryBuilder('match')
      .where('match.careRequestId = :careRequestId', { careRequestId })
      .orderBy('match.score', 'DESC');
    
    if (options?.minScore) {
      query.andWhere('match.score >= :minScore', { minScore: options.minScore });
    }
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    const entities = await query.getMany();
    
    return entities.map(entity => ({
      candidateId: entity.caregiverId,
      score: Number(entity.score),
      breakdown: entity.scoreBreakdown || {},
      insights: entity.insights || {
        matchedSkills: [],
        distanceKm: 0,
        estimatedResponseTime: 0,
        strengths: [],
        considerations: [],
      },
      rank: entity.rank,
      confidence: Number(entity.confidence),
    }));
  }
  
  /**
   * Invite a caregiver for a care request
   */
  async inviteCaregiver(careRequestId: string, caregiverId: string): Promise<void> {
    const match = await this.matchRepo.findOne({
      where: { careRequestId, caregiverId },
    });
    
    if (!match) {
      throw new Error(`Match not found for care request ${careRequestId} and caregiver ${caregiverId}`);
    }
    
    match.status = 'invited';
    match.invitedAt = new Date();
    match.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await this.matchRepo.save(match);
    
    // Publish invitation event
    await this.publishEvent(MatchingEventType.CAREGIVER_INVITED, {
      careRequestId,
      caregiverId,
      matchId: match.id,
      score: match.score,
      timestamp: new Date(),
    });
    
    this.logger.log(`Invited caregiver ${caregiverId} for care request ${careRequestId}`);
  }
  
  /**
   * Handle caregiver response to invitation
   */
  async handleCaregiverResponse(
    careRequestId: string,
    caregiverId: string,
    accepted: boolean,
    declineReason?: string
  ): Promise<void> {
    const match = await this.matchRepo.findOne({
      where: { careRequestId, caregiverId },
    });
    
    if (!match) {
      throw new Error(`Match not found for care request ${careRequestId} and caregiver ${caregiverId}`);
    }
    
    match.status = accepted ? 'accepted' : 'declined';
    match.respondedAt = new Date();
    
    if (!accepted && declineReason) {
      match.declineReason = declineReason;
    }
    
    await this.matchRepo.save(match);
    
    // Publish response event
    const eventType = accepted ? MatchingEventType.CAREGIVER_ACCEPTED : MatchingEventType.CAREGIVER_DECLINED;
    await this.publishEvent(eventType, {
      careRequestId,
      caregiverId,
      matchId: match.id,
      accepted,
      declineReason,
      timestamp: new Date(),
    });
    
    this.logger.log(`Caregiver ${caregiverId} ${accepted ? 'accepted' : 'declined'} care request ${careRequestId}`);
  }
}


import { Injectable, Logger } from '@nestjs/common';
import {
  CareRequest,
  CaregiverCandidate,
  ScoredMatch,
  ScoreBreakdown,
  IAIScorer,
} from '../interfaces/matching.interfaces';

/**
 * AI Scoring Service - Enterprise Grade with Parallel Processing
 * 
 * Uber-grade scoring implementation with:
 * - Parallel scoring with configurable chunk size
 * - Per-candidate timeout with fallback to heuristic
 * - Circuit breaker pattern for resilience
 * - Performance metrics tracking
 */
@Injectable()
export class AIScoringService implements IAIScorer {
  private readonly logger = new Logger(AIScoringService.name);
  private readonly version = '2.0.0-microservice';
  
  // Performance configuration
  private readonly CHUNK_SIZE = parseInt(process.env.AI_SCORING_CHUNK_SIZE || '10', 10);
  private readonly TIMEOUT_MS = parseInt(process.env.AI_SCORING_TIMEOUT_MS || '1000', 10);
  private readonly MAX_PARALLEL = parseInt(process.env.AI_SCORING_MAX_PARALLEL || '5', 10);
  
  // Circuit breaker state
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly ERROR_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_MS = 30000;
  
  // Metrics tracking
  private scoringMetrics = {
    totalScored: 0,
    totalTime: 0,
    timeouts: 0,
    errors: 0,
    avgTimePerCandidate: 0,
  };

  /**
   * Score candidates against a care request using parallel processing
   */
  async scoreMatches(
    careRequest: CareRequest,
    candidates: CaregiverCandidate[]
  ): Promise<ScoredMatch[]> {
    const startTime = Date.now();
    this.logger.debug(`Scoring ${candidates.length} candidates for care request ${careRequest.id}`);
    
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      this.logger.warn('Circuit breaker OPEN - using fast heuristic scoring');
      return this.scoreFastHeuristic(careRequest, candidates);
    }
    
    try {
      // Split into chunks for parallel processing
      const chunks = this.chunkArray(candidates, this.CHUNK_SIZE);
      this.logger.debug(`Processing ${chunks.length} chunks of ${this.CHUNK_SIZE} candidates each`);
      
      // Process chunks in parallel with concurrency limit
      const results: ScoredMatch[] = [];
      
      for (let i = 0; i < chunks.length; i += this.MAX_PARALLEL) {
        const chunkBatch = chunks.slice(i, i + this.MAX_PARALLEL);
        const batchResults = await Promise.all(
          chunkBatch.map(chunk => this.scoreChunkWithTimeout(careRequest, chunk))
        );
        results.push(...batchResults.flat());
      }
      
      // Track metrics
      const duration = Date.now() - startTime;
      this.updateMetrics(candidates.length, duration);
      
      this.logger.log(`Scored ${results.length} candidates in ${duration}ms (avg: ${(duration / candidates.length).toFixed(1)}ms/candidate)`);
      
      // Reset error count on success
      this.errorCount = 0;
      
      // Sort by score descending and assign ranks
      return results
        .sort((a, b) => b.score - a.score)
        .map((match, index) => ({ ...match, rank: index + 1 }));
      
    } catch (error) {
      this.recordError();
      this.logger.error(`Scoring failed, falling back to heuristic: ${error}`);
      return this.scoreFastHeuristic(careRequest, candidates);
    }
  }
  
  /**
   * Score a chunk of candidates with timeout protection
   */
  private async scoreChunkWithTimeout(
    careRequest: CareRequest,
    chunk: CaregiverCandidate[]
  ): Promise<ScoredMatch[]> {
    return Promise.race([
      this.scoreChunk(careRequest, chunk),
      this.timeout(this.TIMEOUT_MS).then(() => {
        this.scoringMetrics.timeouts++;
        this.logger.warn(`Chunk timeout after ${this.TIMEOUT_MS}ms, using heuristic fallback`);
        return this.scoreFastHeuristic(careRequest, chunk);
      })
    ]);
  }
  
  /**
   * Score a chunk of candidates
   */
  private async scoreChunk(
    careRequest: CareRequest,
    chunk: CaregiverCandidate[]
  ): Promise<ScoredMatch[]> {
    return Promise.all(
      chunk.map(async (candidate) => {
        try {
          const breakdown = this.calculateScoreBreakdown(careRequest, candidate);
          const totalScore = this.calculateTotalScore(breakdown);
          
          return {
            candidateId: candidate.id,
            score: totalScore,
            breakdown,
            insights: this.generateInsights(careRequest, candidate, breakdown),
            rank: 0,
            confidence: this.calculateConfidence(breakdown),
          };
        } catch (error) {
          this.logger.warn(`Error scoring candidate ${candidate.id}: ${error}`);
          return this.createFallbackScore(candidate);
        }
      })
    );
  }
  
  /**
   * Fast heuristic scoring - used when circuit is open or as fallback
   */
  private scoreFastHeuristic(
    careRequest: CareRequest,
    candidates: CaregiverCandidate[]
  ): ScoredMatch[] {
    return candidates.map((candidate, index) => {
      let score = 70; // Base score
      
      // Quick skill check
      if (careRequest.requiredSkills?.length) {
        const hasSkills = careRequest.requiredSkills.some(skill =>
          candidate.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
        score += hasSkills ? 15 : -10;
      }
      
      // Quick experience check
      if (candidate.experienceYears >= (careRequest.requiredExperience || 0)) {
        score += Math.min(10, candidate.experienceYears);
      }
      
      // Rating bonus
      score += (candidate.metrics.rating - 3) * 5;
      
      return {
        candidateId: candidate.id,
        score: Math.max(0, Math.min(100, score)),
        breakdown: { heuristic: true },
        insights: {
          matchedSkills: [],
          distanceKm: candidate.calculatedDistanceKm || 0,
          estimatedResponseTime: candidate.metrics.responseTimeMinutes,
          strengths: [],
          considerations: ['Scored using fast heuristic due to system load'],
        },
        rank: index + 1,
        confidence: 0.5,
      };
    });
  }
  
  /**
   * Create fallback score for error cases
   */
  private createFallbackScore(candidate: CaregiverCandidate): ScoredMatch {
    return {
      candidateId: candidate.id,
      score: 60,
      breakdown: { fallback: true },
      insights: {
        matchedSkills: [],
        distanceKm: candidate.calculatedDistanceKm || 0,
        estimatedResponseTime: candidate.metrics.responseTimeMinutes,
        strengths: [],
        considerations: ['Fallback scoring applied'],
      },
      rank: 0,
      confidence: 0.3,
    };
  }
  
  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    careRequest: CareRequest,
    candidate: CaregiverCandidate
  ): ScoreBreakdown {
    return {
      skillMatch: this.calculateSkillMatch(careRequest, candidate),
      experienceMatch: this.calculateExperienceMatch(careRequest, candidate),
      availabilityMatch: this.calculateAvailabilityMatch(careRequest, candidate),
      distanceScore: this.calculateDistanceScore(careRequest, candidate),
      performanceScore: this.calculatePerformanceScore(candidate),
      preferenceAlignment: this.calculatePreferenceAlignment(careRequest, candidate),
      budgetCompatibility: this.calculateBudgetMatch(careRequest, candidate),
    };
  }
  
  /**
   * Calculate skill match score (0-100)
   */
  private calculateSkillMatch(careRequest: CareRequest, candidate: CaregiverCandidate): number {
    if (!careRequest.requiredSkills || careRequest.requiredSkills.length === 0) {
      return 100;
    }
    
    let matchedCount = 0;
    for (const required of careRequest.requiredSkills) {
      const hasSkill = candidate.skills.some(skill => {
        const reqLower = required.toLowerCase();
        const skillLower = skill.toLowerCase();
        return skillLower === reqLower || 
               skillLower.includes(reqLower) || 
               reqLower.includes(skillLower);
      });
      if (hasSkill) matchedCount++;
    }
    
    return Math.round((matchedCount / careRequest.requiredSkills.length) * 100);
  }
  
  /**
   * Calculate experience match score (0-100)
   */
  private calculateExperienceMatch(careRequest: CareRequest, candidate: CaregiverCandidate): number {
    const requiredExperience = careRequest.requiredExperience || 0;
    const candidateExperience = candidate.experienceYears;
    
    if (candidateExperience >= requiredExperience) {
      return Math.min(100, 80 + (candidateExperience - requiredExperience) * 4);
    }
    
    const deficit = requiredExperience - candidateExperience;
    return Math.max(0, 80 - deficit * 20);
  }
  
  /**
   * Calculate availability match score (0-100)
   */
  private calculateAvailabilityMatch(careRequest: CareRequest, candidate: CaregiverCandidate): number {
    let score = 70; // Base score
    
    // Check immediate availability for urgent requests
    if (careRequest.urgency === 'urgent' || careRequest.urgency === 'immediate') {
      if (candidate.availability.immediate) {
        score += 20;
      } else {
        score -= 15;
      }
    }
    
    // Check overnight capability
    if (candidate.availability.overnight) {
      score += 5;
    }
    
    // Check live-in capability
    if (candidate.availability.liveIn) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate distance score (0-100)
   */
  private calculateDistanceScore(careRequest: CareRequest, candidate: CaregiverCandidate): number {
    const distance = candidate.calculatedDistanceKm;
    const maxDistance = candidate.preferences?.maxDistanceKm || 30;
    
    if (typeof distance !== 'number' || distance < 0) {
      return 75; // Neutral score if no distance data
    }
    
    const distanceRatio = distance / maxDistance;
    
    if (distanceRatio <= 0.33) return 100;
    if (distanceRatio <= 0.66) return 85;
    if (distanceRatio <= 1) return 70;
    
    return Math.max(30, 70 - ((distanceRatio - 1) * 40));
  }
  
  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(candidate: CaregiverCandidate): number {
    const ratingWeight = 0.4;
    const experienceWeight = 0.3;
    const acceptanceWeight = 0.2;
    const reliabilityWeight = 0.1;
    
    const ratingScore = (candidate.metrics.rating / 5) * 100;
    const experienceScore = Math.min(100, candidate.metrics.completedCareRequests * 2);
    const acceptanceScore = candidate.metrics.acceptanceRate * 100;
    const reliabilityScore = candidate.metrics.reliabilityScore * 100;
    
    return Math.round(
      ratingScore * ratingWeight +
      experienceScore * experienceWeight +
      acceptanceScore * acceptanceWeight +
      reliabilityScore * reliabilityWeight
    );
  }
  
  /**
   * Calculate preference alignment (0-100)
   */
  private calculatePreferenceAlignment(careRequest: CareRequest, candidate: CaregiverCandidate): number {
    let score = 80;
    
    // Language preference
    if (careRequest.preferredLanguages?.length) {
      const hasPreferredLanguage = careRequest.preferredLanguages.some(lang =>
        candidate.languages.includes(lang)
      );
      score += hasPreferredLanguage ? 10 : -10;
    }
    
    // Care type preference
    if (careRequest.careType && candidate.preferences.careTypes.includes(careRequest.careType)) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate budget compatibility (0-100)
   */
  private calculateBudgetMatch(careRequest: CareRequest, candidate: CaregiverCandidate): number {
    const patientBudgetMin = careRequest.budgetMin;
    const patientBudgetMax = careRequest.budgetMax;
    const caregiverRateMin = candidate.preferences.hourlyRateMin || candidate.hourlyRateMin;
    const caregiverRateMax = candidate.preferences.hourlyRateMax || candidate.hourlyRateMax;
    
    if (!patientBudgetMin && !patientBudgetMax) return 100;
    if (!caregiverRateMin && !caregiverRateMax) return 90;
    
    // Check overlap
    const patientMax = patientBudgetMax || patientBudgetMin || 0;
    const patientMin = patientBudgetMin || 0;
    const caregiverMin = caregiverRateMin || 0;
    const caregiverMax = caregiverRateMax || caregiverMin || 0;
    
    if (caregiverMin > patientMax) {
      const overage = ((caregiverMin - patientMax) / patientMax) * 100;
      return Math.max(0, 70 - overage);
    }
    
    if (patientMin >= caregiverMax) {
      return 100;
    }
    
    // Partial overlap
    const overlapStart = Math.max(patientMin, caregiverMin);
    const overlapEnd = Math.min(patientMax, caregiverMax);
    const patientRange = patientMax - patientMin || 1;
    const overlapRatio = (overlapEnd - overlapStart) / patientRange;
    
    return Math.round(70 + overlapRatio * 30);
  }
  
  /**
   * Calculate total score from breakdown
   */
  private calculateTotalScore(breakdown: ScoreBreakdown): number {
    const weights = {
      skillMatch: 0.20,
      experienceMatch: 0.15,
      availabilityMatch: 0.10,
      distanceScore: 0.15,
      performanceScore: 0.15,
      preferenceAlignment: 0.10,
      budgetCompatibility: 0.15,
    };
    
    let totalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      totalScore += ((breakdown as any)[key] || 0) * weight;
    }
    
    return Math.round(totalScore);
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(breakdown: ScoreBreakdown): number {
    const scores = Object.values(breakdown).filter(v => typeof v === 'number') as number[];
    if (scores.length === 0) return 0.5;
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    
    return Math.max(0, 1 - (variance / 2500));
  }
  
  /**
   * Generate matching insights
   */
  private generateInsights(
    careRequest: CareRequest,
    candidate: CaregiverCandidate,
    breakdown: ScoreBreakdown
  ): ScoredMatch['insights'] {
    const matchedSkills = careRequest.requiredSkills?.filter(skill =>
      candidate.skills.some(s => s.toLowerCase() === skill.toLowerCase())
    ) || [];
    
    const strengths: string[] = [];
    const considerations: string[] = [];
    
    // Identify strengths
    if ((breakdown.skillMatch || 0) >= 80) strengths.push('Excellent skill match');
    if (candidate.metrics.rating >= 4.5) strengths.push('Highly rated caregiver');
    if (candidate.experienceYears >= 5) strengths.push(`${candidate.experienceYears} years of experience`);
    if ((breakdown.availabilityMatch || 0) >= 90) strengths.push('Great availability match');
    if ((breakdown.budgetCompatibility || 0) >= 90) strengths.push('Excellent budget fit');
    if ((breakdown.distanceScore || 0) >= 90) strengths.push('Very close proximity');
    
    // Identify considerations
    if ((breakdown.skillMatch || 0) < 60) considerations.push('Limited skill match');
    if ((breakdown.distanceScore || 0) < 70) considerations.push('Further distance than ideal');
    if (candidate.metrics.acceptanceRate < 0.5) considerations.push('Lower acceptance rate');
    if ((breakdown.availabilityMatch || 0) < 60) considerations.push('Schedule may need adjustment');
    if ((breakdown.budgetCompatibility || 0) < 60) considerations.push('Rate may exceed budget');
    
    return {
      matchedSkills,
      distanceKm: candidate.calculatedDistanceKm || 0,
      estimatedResponseTime: candidate.metrics.responseTimeMinutes,
      strengths,
      considerations,
    };
  }
  
  getVersion(): string {
    return this.version;
  }
  
  async healthCheck(): Promise<boolean> {
    return !this.isCircuitOpen();
  }
  
  getMetrics(): typeof this.scoringMetrics {
    return { ...this.scoringMetrics };
  }
  
  /**
   * Circuit breaker check
   */
  private isCircuitOpen(): boolean {
    if (this.errorCount >= this.ERROR_THRESHOLD) {
      if (Date.now() - this.lastErrorTime < this.CIRCUIT_RESET_MS) {
        return true;
      }
      this.errorCount = 0;
    }
    return false;
  }
  
  private recordError(): void {
    this.errorCount++;
    this.lastErrorTime = Date.now();
    this.scoringMetrics.errors++;
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }
  
  private updateMetrics(count: number, duration: number): void {
    this.scoringMetrics.totalScored += count;
    this.scoringMetrics.totalTime += duration;
    this.scoringMetrics.avgTimePerCandidate = 
      this.scoringMetrics.totalTime / this.scoringMetrics.totalScored;
  }
}








import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FraudEvent } from '../entities/fraud-event.entity';
import { DeviceFingerprint } from '../entities/device-fingerprint.entity';
import { BlacklistEntry, BlacklistType } from '../entities/blacklist.entity';
import {
  FraudScoringRequest,
  FraudScoringResult,
  FraudRiskLevel,
  FraudDecision,
  FraudSignal,
  FraudSignalSource,
  VelocityCheckResult,
} from '../interfaces/fraud.interface';
import { RuleEngineService } from './rule-engine.service';

/**
 * Fraud Scoring Service
 * Enterprise-grade ML-powered fraud scoring with multi-signal analysis
 */
@Injectable()
export class FraudScoringService {
  private readonly logger = new Logger(FraudScoringService.name);
  private readonly thresholds: { low: number; medium: number; high: number; critical: number };
  private readonly weights: Record<string, number>;

  constructor(
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
    @InjectRepository(DeviceFingerprint)
    private readonly deviceRepo: Repository<DeviceFingerprint>,
    @InjectRepository(BlacklistEntry)
    private readonly blacklistRepo: Repository<BlacklistEntry>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly ruleEngine: RuleEngineService,
  ) {
    this.thresholds = this.configService.get('scoring.thresholds') || {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.95,
    };
    this.weights = this.configService.get('scoring.weights') || {
      velocityCheck: 0.25,
      deviceFingerprint: 0.2,
      geolocation: 0.15,
      behaviorPattern: 0.2,
      identityMatch: 0.2,
    };
  }

  /**
   * Score a fraud event using multiple signals and ML models
   */
  async scoreEvent(request: FraudScoringRequest): Promise<FraudScoringResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const signals: FraudSignal[] = [];

    try {
      // 1. Check blacklists first (immediate block)
      const blacklistResult = await this.checkBlacklists(request);
      if (blacklistResult.isBlocked) {
        return this.createBlockedResult(requestId, blacklistResult.reason, startTime);
      }

      // 2. Velocity checks
      const velocitySignal = await this.performVelocityChecks(request);
      signals.push(velocitySignal);

      // 3. Device fingerprint analysis
      if (request.deviceFingerprint) {
        const deviceSignal = await this.analyzeDeviceFingerprint(request);
        signals.push(deviceSignal);
      }

      // 4. Geolocation analysis
      if (request.geolocation) {
        const geoSignal = await this.analyzeGeolocation(request);
        signals.push(geoSignal);
      }

      // 5. Behavior pattern analysis
      if (request.userId) {
        const behaviorSignal = await this.analyzeBehaviorPattern(request);
        signals.push(behaviorSignal);
      }

      // 6. ML model scoring (if enabled)
      const mlEnabled = this.configService.get('ruleEngine.enableMLScoring', true);
      if (mlEnabled) {
        const mlSignal = await this.getMLScore(request);
        if (mlSignal) {
          signals.push(mlSignal);
        }
      }

      // 7. Apply rule engine
      const ruleResults = await this.ruleEngine.evaluateRules(request, signals);

      // 8. Calculate final score
      const { riskScore, riskLevel } = this.calculateFinalScore(signals, ruleResults.scoreAdjustment);

      // 9. Determine decision
      const decision = this.determineDecision(riskScore, riskLevel, ruleResults);

      // 10. Create and save event
      const result: FraudScoringResult = {
        requestId,
        riskScore,
        riskLevel,
        decision,
        signals,
        appliedRules: ruleResults.appliedRules,
        recommendations: this.generateRecommendations(riskScore, signals, decision),
        requiresMfa: decision === FraudDecision.CHALLENGE,
        requiresReview: decision === FraudDecision.REVIEW,
        evaluationTimeMs: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Save the event asynchronously
      this.saveEventAsync(request, result).catch((err) =>
        this.logger.error('Failed to save fraud event', err),
      );

      return result;
    } catch (error) {
      this.logger.error('Error scoring fraud event', error);
      // Return a safe default on error
      return {
        requestId,
        riskScore: 0.5,
        riskLevel: FraudRiskLevel.MEDIUM,
        decision: FraudDecision.REVIEW,
        signals: [],
        appliedRules: [],
        recommendations: ['Manual review recommended due to scoring error'],
        requiresMfa: true,
        requiresReview: true,
        evaluationTimeMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check all blacklists for blocked entities
   */
  private async checkBlacklists(
    request: FraudScoringRequest,
  ): Promise<{ isBlocked: boolean; reason: string }> {
    const checks: Array<{ type: BlacklistType; value: string | undefined }> = [
      { type: BlacklistType.IP_ADDRESS, value: request.ipAddress },
      { type: BlacklistType.DEVICE_FINGERPRINT, value: request.deviceFingerprint?.fingerprintId },
      { type: BlacklistType.USER_ID, value: request.userId },
    ];

    for (const check of checks) {
      if (!check.value) continue;

      const entry = await this.blacklistRepo.findOne({
        where: {
          type: check.type,
          normalizedValue: check.value.toLowerCase(),
          isActive: true,
        },
      });

      if (entry) {
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          continue;
        }

        // Update hit count
        await this.blacklistRepo.update(entry.id, {
          hitCount: entry.hitCount + 1,
          lastHitAt: new Date(),
        });

        return { isBlocked: true, reason: `Blocked: ${check.type} - ${entry.reason}` };
      }
    }

    return { isBlocked: false, reason: '' };
  }

  /**
   * Perform velocity checks (rate limiting analysis)
   */
  private async performVelocityChecks(request: FraudScoringRequest): Promise<FraudSignal> {
    const checks: VelocityCheckResult[] = [];
    const now = new Date();

    // Check login attempts in last hour
    if (request.userId) {
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const loginCount = await this.eventRepo.count({
        where: {
          userId: request.userId,
          eventType: request.eventType,
          createdAt: hourAgo,
        },
      });
      checks.push({
        passed: loginCount < 10,
        checkType: 'hourly_event_limit',
        count: loginCount,
        limit: 10,
        timeWindowMinutes: 60,
        details: `${loginCount} events in last hour`,
      });
    }

    // Check IP velocity
    if (request.ipAddress) {
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const ipCount = await this.eventRepo.count({
        where: {
          ipAddress: request.ipAddress,
          createdAt: tenMinutesAgo,
        },
      });
      checks.push({
        passed: ipCount < 20,
        checkType: 'ip_velocity',
        count: ipCount,
        limit: 20,
        timeWindowMinutes: 10,
        details: `${ipCount} events from IP in last 10 minutes`,
      });
    }

    const failedChecks = checks.filter((c) => !c.passed);
    const score = failedChecks.length > 0 ? Math.min(failedChecks.length * 0.3, 1) : 0;

    return {
      source: FraudSignalSource.VELOCITY_CHECK,
      signalName: 'velocity_analysis',
      score,
      weight: this.weights.velocityCheck,
      details: { checks, failedCount: failedChecks.length },
      isTriggered: score > 0.3,
    };
  }

  /**
   * Analyze device fingerprint
   */
  private async analyzeDeviceFingerprint(request: FraudScoringRequest): Promise<FraudSignal> {
    const fp = request.deviceFingerprint;
    if (!fp?.fingerprintId) {
      return this.createNeutralSignal(FraudSignalSource.DEVICE_FINGERPRINT, 'device_fingerprint');
    }

    // Look up existing device
    const device = await this.deviceRepo.findOne({
      where: { fingerprintHash: fp.fingerprintId },
    });

    let score = 0.2; // Base neutral score
    const details: Record<string, unknown> = {};

    if (device) {
      details.isKnownDevice = true;
      details.trustScore = device.trustScore;

      if (device.isBlocked) {
        score = 1.0;
        details.blocked = true;
        details.blockReason = device.blockReason;
      } else if (device.isTrusted) {
        score = 0;
        details.trusted = true;
      } else {
        // Use stored trust score
        score = 1 - Number(device.trustScore);
      }

      // Check if device is associated with multiple users
      if (device.associatedUserIds.length > 3) {
        score = Math.min(score + 0.2, 1);
        details.multipleUsersWarning = true;
        details.associatedUserCount = device.associatedUserIds.length;
      }
    } else {
      details.isKnownDevice = false;
      score = 0.3; // New device gets slight risk score
    }

    return {
      source: FraudSignalSource.DEVICE_FINGERPRINT,
      signalName: 'device_fingerprint',
      score,
      weight: this.weights.deviceFingerprint,
      details,
      isTriggered: score > 0.4,
    };
  }

  /**
   * Analyze geolocation data
   */
  private async analyzeGeolocation(request: FraudScoringRequest): Promise<FraudSignal> {
    const geo = request.geolocation;
    if (!geo) {
      return this.createNeutralSignal(FraudSignalSource.GEOLOCATION, 'geolocation');
    }

    let score = 0;
    const details: Record<string, unknown> = { ...geo };

    // High-risk indicators
    if (geo.isVpn) {
      score += 0.3;
      details.vpnDetected = true;
    }
    if (geo.isProxy) {
      score += 0.25;
      details.proxyDetected = true;
    }
    if (geo.isTor) {
      score += 0.4;
      details.torDetected = true;
    }

    // Check for impossible travel (if we have user history)
    if (request.userId && geo.latitude && geo.longitude) {
      const lastEvent = await this.eventRepo.findOne({
        where: { userId: request.userId },
        order: { createdAt: 'DESC' },
      });

      if (lastEvent?.metadata?.geolocation) {
        const lastGeo = lastEvent.metadata.geolocation as { latitude: number; longitude: number };
        const timeDiffHours =
          (Date.now() - lastEvent.createdAt.getTime()) / (1000 * 60 * 60);
        const distance = this.calculateDistance(
          geo.latitude,
          geo.longitude,
          lastGeo.latitude,
          lastGeo.longitude,
        );
        const speedKmh = distance / Math.max(timeDiffHours, 0.1);

        if (speedKmh > 1000) {
          // Faster than commercial flight
          score += 0.5;
          details.impossibleTravel = true;
          details.estimatedSpeedKmh = speedKmh;
        }
      }
    }

    return {
      source: FraudSignalSource.GEOLOCATION,
      signalName: 'geolocation_analysis',
      score: Math.min(score, 1),
      weight: this.weights.geolocation,
      details,
      isTriggered: score > 0.3,
    };
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeBehaviorPattern(request: FraudScoringRequest): Promise<FraudSignal> {
    if (!request.userId) {
      return this.createNeutralSignal(FraudSignalSource.BEHAVIOR_ANALYSIS, 'behavior_pattern');
    }

    // Get user's recent event history
    const recentEvents = await this.eventRepo.find({
      where: { userId: request.userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    let score = 0;
    const details: Record<string, unknown> = {};

    if (recentEvents.length === 0) {
      // New user - slight risk
      score = 0.2;
      details.newUser = true;
    } else {
      // Analyze patterns
      const avgRiskScore =
        recentEvents.reduce((sum, e) => sum + Number(e.riskScore), 0) / recentEvents.length;
      details.historicalAvgRisk = avgRiskScore;

      // Check for sudden changes in behavior
      const recentHighRiskCount = recentEvents.filter(
        (e) => e.riskLevel === FraudRiskLevel.HIGH || e.riskLevel === FraudRiskLevel.CRITICAL,
      ).length;

      if (recentHighRiskCount > 5) {
        score += 0.3;
        details.recentHighRiskEvents = recentHighRiskCount;
      }

      // Check for denied transactions
      const deniedCount = recentEvents.filter((e) => e.decision === FraudDecision.DENY).length;
      if (deniedCount > 0) {
        score += Math.min(deniedCount * 0.1, 0.4);
        details.recentDenials = deniedCount;
      }
    }

    return {
      source: FraudSignalSource.BEHAVIOR_ANALYSIS,
      signalName: 'behavior_pattern',
      score: Math.min(score, 1),
      weight: this.weights.behaviorPattern,
      details,
      isTriggered: score > 0.3,
    };
  }

  /**
   * Get ML model score from AI service
   */
  private async getMLScore(request: FraudScoringRequest): Promise<FraudSignal | null> {
    const aiServiceUrl = this.configService.get('ai.serviceUrl');
    const endpoint = this.configService.get('ai.modelEndpoints.fraudScoring');
    const timeout = this.configService.get('ai.timeout', 5000);

    if (!aiServiceUrl) {
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${aiServiceUrl}${endpoint}`,
          {
            eventType: request.eventType,
            userId: request.userId,
            ipAddress: request.ipAddress,
            deviceData: request.deviceFingerprint,
            geoData: request.geolocation,
            transactionData: request.transactionData,
          },
          { timeout },
        ),
      );

      const mlResult = response.data;
      return {
        source: FraudSignalSource.ML_MODEL,
        signalName: 'ml_fraud_model',
        score: mlResult.score || 0.5,
        weight: 0.3, // ML model has high weight
        details: {
          modelVersion: mlResult.modelVersion,
          confidence: mlResult.confidence,
          features: mlResult.topFeatures,
        },
        isTriggered: (mlResult.score || 0.5) > 0.5,
      };
    } catch (error) {
      this.logger.warn('ML scoring unavailable, using rule-based scoring only');
      return null;
    }
  }

  /**
   * Calculate final weighted score
   */
  private calculateFinalScore(
    signals: FraudSignal[],
    ruleAdjustment: number,
  ): { riskScore: number; riskLevel: FraudRiskLevel } {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      weightedSum += signal.score * signal.weight;
      totalWeight += signal.weight;
    }

    let riskScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    riskScore = Math.max(0, Math.min(1, riskScore + ruleAdjustment));

    let riskLevel: FraudRiskLevel;
    if (riskScore >= this.thresholds.critical) {
      riskLevel = FraudRiskLevel.CRITICAL;
    } else if (riskScore >= this.thresholds.high) {
      riskLevel = FraudRiskLevel.HIGH;
    } else if (riskScore >= this.thresholds.medium) {
      riskLevel = FraudRiskLevel.MEDIUM;
    } else {
      riskLevel = FraudRiskLevel.LOW;
    }

    return { riskScore, riskLevel };
  }

  /**
   * Determine the fraud decision
   */
  private determineDecision(
    riskScore: number,
    riskLevel: FraudRiskLevel,
    ruleResults: { forcedDecision?: FraudDecision },
  ): FraudDecision {
    // Rule engine can override
    if (ruleResults.forcedDecision) {
      return ruleResults.forcedDecision;
    }

    if (riskLevel === FraudRiskLevel.CRITICAL) {
      return FraudDecision.DENY;
    }
    if (riskLevel === FraudRiskLevel.HIGH) {
      return FraudDecision.CHALLENGE;
    }
    if (riskLevel === FraudRiskLevel.MEDIUM) {
      return FraudDecision.REVIEW;
    }
    return FraudDecision.ALLOW;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    riskScore: number,
    signals: FraudSignal[],
    decision: FraudDecision,
  ): string[] {
    const recommendations: string[] = [];

    const triggeredSignals = signals.filter((s) => s.isTriggered);
    for (const signal of triggeredSignals) {
      switch (signal.source) {
        case FraudSignalSource.VELOCITY_CHECK:
          recommendations.push('Consider implementing rate limiting');
          break;
        case FraudSignalSource.DEVICE_FINGERPRINT:
          recommendations.push('Verify device ownership through secondary channel');
          break;
        case FraudSignalSource.GEOLOCATION:
          if (signal.details?.impossibleTravel) {
            recommendations.push('Verify user identity - impossible travel detected');
          }
          if (signal.details?.vpnDetected || signal.details?.torDetected) {
            recommendations.push('Request additional authentication - anonymizer detected');
          }
          break;
      }
    }

    if (decision === FraudDecision.REVIEW) {
      recommendations.push('Manual review recommended before proceeding');
    }

    return recommendations;
  }

  /**
   * Save event asynchronously
   */
  private async saveEventAsync(
    request: FraudScoringRequest,
    result: FraudScoringResult,
  ): Promise<void> {
    const event = this.eventRepo.create({
      userId: request.userId,
      sessionId: request.sessionId,
      eventType: request.eventType,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      decision: result.decision,
      ipAddress: request.ipAddress,
      deviceFingerprint: request.deviceFingerprint?.fingerprintId,
      userAgent: request.userAgent,
      country: request.geolocation?.countryCode,
      city: request.geolocation?.city,
      isVpn: request.geolocation?.isVpn || false,
      isProxy: request.geolocation?.isProxy || false,
      isTor: request.geolocation?.isTor || false,
      signals: result.signals as unknown as Record<string, unknown>,
      appliedRules: result.appliedRules as unknown as Record<string, unknown>[],
      transactionData: request.transactionData as unknown as Record<string, unknown>,
      metadata: request.metadata,
      evaluationTimeMs: result.evaluationTimeMs,
      requiresReview: result.requiresReview,
    });

    await this.eventRepo.save(event);
  }

  /**
   * Create a blocked result
   */
  private createBlockedResult(
    requestId: string,
    reason: string,
    startTime: number,
  ): FraudScoringResult {
    return {
      requestId,
      riskScore: 1.0,
      riskLevel: FraudRiskLevel.CRITICAL,
      decision: FraudDecision.BLOCK,
      signals: [
        {
          source: FraudSignalSource.BLACKLIST_MATCH,
          signalName: 'blacklist_match',
          score: 1.0,
          weight: 1.0,
          details: { reason },
          isTriggered: true,
        },
      ],
      appliedRules: [],
      recommendations: ['Entity is on blacklist'],
      requiresMfa: false,
      requiresReview: false,
      evaluationTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Create neutral signal
   */
  private createNeutralSignal(source: FraudSignalSource, name: string): FraudSignal {
    return {
      source,
      signalName: name,
      score: 0.2,
      weight: 0.1,
      details: { dataNotAvailable: true },
      isTriggered: false,
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `fraud_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}


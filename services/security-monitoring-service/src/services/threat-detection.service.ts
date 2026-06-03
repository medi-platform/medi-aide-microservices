import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SecurityEvent } from '../entities/security-event.entity';
import { ThreatIndicator } from '../entities/threat-indicator.entity';
import {
  ThreatIndicatorType,
  AnomalyDetectionResult,
  SecurityEventType,
} from '../interfaces/security.interface';

interface ThreatMatchResult {
  isMatch: boolean;
  matchedIndicators: ThreatIndicator[];
  highestConfidence: number;
  description: string;
}

/**
 * Threat Detection Service
 * Detects threats and anomalies in security events
 */
@Injectable()
export class ThreatDetectionService {
  private readonly logger = new Logger(ThreatDetectionService.name);
  private readonly baselineWindow: number;
  private readonly sensitivity: number;

  constructor(
    @InjectRepository(SecurityEvent)
    private readonly eventRepo: Repository<SecurityEvent>,
    @InjectRepository(ThreatIndicator)
    private readonly indicatorRepo: Repository<ThreatIndicator>,
    private readonly configService: ConfigService,
  ) {
    this.baselineWindow = this.configService.get('anomalyDetection.baselineWindowDays', 30);
    this.sensitivity = this.configService.get('anomalyDetection.sensitivityLevel', 2.5);
  }

  /**
   * Check event against threat indicators
   */
  async checkEvent(event: SecurityEvent): Promise<ThreatMatchResult> {
    const matchedIndicators: ThreatIndicator[] = [];

    // Check IP address
    if (event.ipAddress) {
      const ipMatch = await this.checkIndicator(ThreatIndicatorType.IP_ADDRESS, event.ipAddress);
      if (ipMatch) matchedIndicators.push(ipMatch);
    }

    // Check user agent patterns
    if (event.userAgent) {
      const uaMatch = await this.checkIndicator(ThreatIndicatorType.USER_AGENT, event.userAgent);
      if (uaMatch) matchedIndicators.push(uaMatch);
    }

    // Check for known attack patterns in details
    if (event.details) {
      const patternMatches = await this.checkPatterns(event.details);
      matchedIndicators.push(...patternMatches);
    }

    if (matchedIndicators.length === 0) {
      return { isMatch: false, matchedIndicators: [], highestConfidence: 0, description: '' };
    }

    // Update hit counts
    for (const indicator of matchedIndicators) {
      await this.indicatorRepo.update(indicator.id, {
        hitCount: indicator.hitCount + 1,
        lastHitAt: new Date(),
      });
    }

    const highestConfidence = Math.max(...matchedIndicators.map((i) => Number(i.confidence)));
    const description = matchedIndicators.map((i) => i.description || i.value).join('; ');

    return {
      isMatch: true,
      matchedIndicators,
      highestConfidence,
      description: `Threat indicators matched: ${description}`,
    };
  }

  /**
   * Check a specific indicator
   */
  private async checkIndicator(
    type: ThreatIndicatorType,
    value: string,
  ): Promise<ThreatIndicator | null> {
    const normalized = this.normalizeValue(type, value);

    const indicator = await this.indicatorRepo.findOne({
      where: {
        type,
        normalizedValue: normalized,
        isActive: true,
      },
    });

    if (!indicator) return null;

    // Check if expired
    if (indicator.expiresAt && indicator.expiresAt < new Date()) {
      return null;
    }

    return indicator;
  }

  /**
   * Check for known attack patterns
   */
  private async checkPatterns(details: Record<string, unknown>): Promise<ThreatIndicator[]> {
    const patterns = await this.indicatorRepo.find({
      where: {
        type: ThreatIndicatorType.PATTERN,
        isActive: true,
      },
    });

    const matches: ThreatIndicator[] = [];
    const detailsStr = JSON.stringify(details).toLowerCase();

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.value, 'i');
        if (regex.test(detailsStr)) {
          matches.push(pattern);
        }
      } catch {
        // Invalid regex, skip
      }
    }

    return matches;
  }

  /**
   * Detect anomalies in event patterns
   */
  async detectAnomaly(event: SecurityEvent): Promise<AnomalyDetectionResult> {
    // Get baseline statistics
    const baseline = await this.getBaseline(event.eventType, event.userId);

    if (!baseline.hasEnoughData) {
      return {
        isAnomaly: false,
        score: 0,
        threshold: this.sensitivity,
        metric: 'event_frequency',
        currentValue: 0,
        expectedValue: 0,
        standardDeviation: 0,
        description: 'Insufficient data for anomaly detection',
      };
    }

    // Check event frequency anomaly
    const currentFrequency = await this.getCurrentFrequency(
      event.eventType,
      event.userId,
      event.ipAddress,
    );

    const zScore = (currentFrequency - baseline.mean) / Math.max(baseline.stdDev, 0.1);
    const isAnomaly = Math.abs(zScore) > this.sensitivity;

    return {
      isAnomaly,
      score: Math.abs(zScore),
      threshold: this.sensitivity,
      metric: 'event_frequency',
      currentValue: currentFrequency,
      expectedValue: baseline.mean,
      standardDeviation: baseline.stdDev,
      description: isAnomaly
        ? `Unusual ${event.eventType} frequency detected (${zScore.toFixed(2)} std devs from mean)`
        : 'Event frequency within normal range',
    };
  }

  /**
   * Get baseline statistics for event type
   */
  private async getBaseline(
    eventType: SecurityEventType,
    userId?: string,
  ): Promise<{ hasEnoughData: boolean; mean: number; stdDev: number }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.baselineWindow);

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .select('DATE(event.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventType = :eventType', { eventType })
      .andWhere('event.createdAt >= :startDate', { startDate })
      .groupBy('DATE(event.created_at)');

    if (userId) {
      qb.andWhere('event.userId = :userId', { userId });
    }

    const dailyCounts = await qb.getRawMany();

    if (dailyCounts.length < 7) {
      return { hasEnoughData: false, mean: 0, stdDev: 0 };
    }

    const counts = dailyCounts.map((d) => parseInt(d.count, 10));
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    return { hasEnoughData: true, mean, stdDev };
  }

  /**
   * Get current frequency for last hour
   */
  private async getCurrentFrequency(
    eventType: SecurityEventType,
    userId?: string,
    ipAddress?: string,
  ): Promise<number> {
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .where('event.eventType = :eventType', { eventType })
      .andWhere('event.createdAt >= :hourAgo', { hourAgo });

    if (userId) {
      qb.andWhere('event.userId = :userId', { userId });
    }
    if (ipAddress) {
      qb.andWhere('event.ipAddress = :ipAddress', { ipAddress });
    }

    return qb.getCount();
  }

  /**
   * Add a threat indicator
   */
  async addIndicator(data: {
    type: ThreatIndicatorType;
    value: string;
    confidence: number;
    source: string;
    description?: string;
    tags?: string[];
    expiresAt?: Date;
  }): Promise<ThreatIndicator> {
    const normalized = this.normalizeValue(data.type, data.value);

    const indicator = this.indicatorRepo.create({
      type: data.type,
      value: data.value,
      normalizedValue: normalized,
      confidence: data.confidence,
      source: data.source,
      description: data.description,
      tags: data.tags || [],
      expiresAt: data.expiresAt,
    });

    return this.indicatorRepo.save(indicator);
  }

  /**
   * Get all active indicators
   */
  async getIndicators(filters?: {
    type?: ThreatIndicatorType;
    source?: string;
    minConfidence?: number;
  }): Promise<ThreatIndicator[]> {
    const qb = this.indicatorRepo
      .createQueryBuilder('indicator')
      .where('indicator.isActive = :isActive', { isActive: true });

    if (filters?.type) {
      qb.andWhere('indicator.type = :type', { type: filters.type });
    }
    if (filters?.source) {
      qb.andWhere('indicator.source = :source', { source: filters.source });
    }
    if (filters?.minConfidence) {
      qb.andWhere('indicator.confidence >= :minConfidence', {
        minConfidence: filters.minConfidence,
      });
    }

    return qb.orderBy('indicator.lastSeenAt', 'DESC').getMany();
  }

  /**
   * Clean up expired indicators
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.indicatorRepo.update(
      {
        isActive: true,
        expiresAt: LessThan(new Date()),
      },
      { isActive: false },
    );
    return result.affected || 0;
  }

  /**
   * Normalize value based on type
   */
  private normalizeValue(type: ThreatIndicatorType, value: string): string {
    switch (type) {
      case ThreatIndicatorType.IP_ADDRESS:
        return value.trim();
      case ThreatIndicatorType.DOMAIN:
      case ThreatIndicatorType.EMAIL:
        return value.toLowerCase().trim();
      case ThreatIndicatorType.URL:
        return value.toLowerCase().replace(/\/$/, '').trim();
      case ThreatIndicatorType.FILE_HASH:
        return value.toLowerCase().trim();
      default:
        return value.trim();
    }
  }
}


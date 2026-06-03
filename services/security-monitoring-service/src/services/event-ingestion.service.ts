import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityEvent } from '../entities/security-event.entity';
import { SecurityEventPayload, SecurityEventType, SecuritySeverity } from '../interfaces/security.interface';
import { ThreatDetectionService } from './threat-detection.service';
import { AlertService } from './alert.service';

/**
 * Event Ingestion Service
 * Handles high-volume security event ingestion and processing
 */
@Injectable()
export class EventIngestionService {
  private readonly logger = new Logger(EventIngestionService.name);
  private eventBuffer: SecurityEventPayload[] = [];
  private readonly bufferSize = 100;
  private readonly flushIntervalMs = 5000;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(SecurityEvent)
    private readonly eventRepo: Repository<SecurityEvent>,
    private readonly threatDetection: ThreatDetectionService,
    private readonly alertService: AlertService,
  ) {
    this.startFlushTimer();
  }

  /**
   * Ingest a single security event
   */
  async ingestEvent(payload: SecurityEventPayload): Promise<{ eventId: string; processed: boolean }> {
    const event = this.eventRepo.create({
      eventType: payload.eventType,
      severity: payload.severity,
      userId: payload.userId,
      sessionId: payload.sessionId,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      resource: payload.resource,
      action: payload.action,
      outcome: payload.outcome,
      details: payload.details,
      metadata: payload.metadata,
    });

    const saved = await this.eventRepo.save(event);

    // Process high-severity events immediately
    if (this.isHighPriority(payload.severity)) {
      await this.processEventAsync(saved);
    } else {
      // Add to buffer for batch processing
      this.eventBuffer.push(payload);
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }
    }

    return { eventId: saved.id, processed: this.isHighPriority(payload.severity) };
  }

  /**
   * Ingest multiple events in batch
   */
  async ingestBatch(events: SecurityEventPayload[]): Promise<{
    received: number;
    processed: number;
    errors: number;
  }> {
    let processed = 0;
    let errors = 0;

    const entities = events.map((payload) =>
      this.eventRepo.create({
        eventType: payload.eventType,
        severity: payload.severity,
        userId: payload.userId,
        sessionId: payload.sessionId,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        resource: payload.resource,
        action: payload.action,
        outcome: payload.outcome,
        details: payload.details,
        metadata: payload.metadata,
      }),
    );

    try {
      const saved = await this.eventRepo.save(entities);
      processed = saved.length;

      // Process high-priority events
      const highPriority = saved.filter((e) => this.isHighPriority(e.severity));
      for (const event of highPriority) {
        await this.processEventAsync(event).catch((err) => {
          this.logger.error(`Error processing event ${event.id}`, err);
          errors++;
        });
      }
    } catch (error) {
      this.logger.error('Error in batch ingestion', error);
      errors = events.length;
    }

    return { received: events.length, processed, errors };
  }

  /**
   * Process a security event asynchronously
   */
  private async processEventAsync(event: SecurityEvent): Promise<void> {
    try {
      // Check against threat indicators
      const threatMatch = await this.threatDetection.checkEvent(event);

      if (threatMatch.isMatch) {
        // Create alert for threat match
        await this.alertService.createFromEvent(event, threatMatch);
      }

      // Check for anomalies
      const anomalyResult = await this.threatDetection.detectAnomaly(event);

      if (anomalyResult.isAnomaly) {
        await this.alertService.createFromAnomaly(event, anomalyResult);
      }

      // Mark as processed
      await this.eventRepo.update(event.id, {
        isProcessed: true,
        processedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error processing event ${event.id}`, error);
    }
  }

  /**
   * Check if event is high priority
   */
  private isHighPriority(severity: SecuritySeverity): boolean {
    return severity === SecuritySeverity.HIGH || severity === SecuritySeverity.CRITICAL;
  }

  /**
   * Flush event buffer
   */
  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    this.logger.debug(`Flushing ${events.length} events from buffer`);

    // Process buffered events in background
    for (const payload of events) {
      const existing = await this.eventRepo.findOne({
        where: {
          eventType: payload.eventType,
          userId: payload.userId,
          sessionId: payload.sessionId,
        },
        order: { createdAt: 'DESC' },
      });

      if (existing && !existing.isProcessed) {
        await this.processEventAsync(existing).catch((err) =>
          this.logger.error('Error processing buffered event', err),
        );
      }
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer().catch((err) => this.logger.error('Error flushing buffer', err));
    }, this.flushIntervalMs);
  }

  /**
   * Get events with filters
   */
  async getEvents(filters: {
    eventType?: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: SecurityEvent[]; total: number }> {
    const qb = this.eventRepo.createQueryBuilder('event');

    if (filters.eventType) {
      qb.andWhere('event.eventType = :eventType', { eventType: filters.eventType });
    }
    if (filters.severity) {
      qb.andWhere('event.severity = :severity', { severity: filters.severity });
    }
    if (filters.userId) {
      qb.andWhere('event.userId = :userId', { userId: filters.userId });
    }
    if (filters.startDate && filters.endDate) {
      qb.andWhere('event.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [events, total] = await qb
      .orderBy('event.createdAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 100)
      .getManyAndCount();

    return { events, total };
  }

  /**
   * Get event statistics
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    const events = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const stats: Record<string, unknown> = {
      totalEvents: events.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byOutcome: { success: 0, failure: 0, pending: 0 },
    };

    for (const event of events) {
      // By type
      const typeStats = stats.byType as Record<string, number>;
      typeStats[event.eventType] = (typeStats[event.eventType] || 0) + 1;

      // By severity
      const sevStats = stats.bySeverity as Record<string, number>;
      sevStats[event.severity] = (sevStats[event.severity] || 0) + 1;

      // By outcome
      const outcomeStats = stats.byOutcome as Record<string, number>;
      outcomeStats[event.outcome] = (outcomeStats[event.outcome] || 0) + 1;
    }

    return stats;
  }
}


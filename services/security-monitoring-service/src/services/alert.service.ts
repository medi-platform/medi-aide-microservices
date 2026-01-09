import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SecurityAlert } from '../entities/security-alert.entity';
import { SecurityEvent } from '../entities/security-event.entity';
import { ThreatIndicator } from '../entities/threat-indicator.entity';
import {
  AlertStatus,
  AlertPriority,
  SecuritySeverity,
  AnomalyDetectionResult,
} from '../interfaces/security.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Alert Service
 * Manages security alerts and notifications
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(SecurityAlert)
    private readonly alertRepo: Repository<SecurityAlert>,
    @InjectRepository(SecurityEvent)
    private readonly eventRepo: Repository<SecurityEvent>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create alert from security event and threat match
   */
  async createFromEvent(
    event: SecurityEvent,
    threatMatch: { matchedIndicators: ThreatIndicator[]; description: string },
  ): Promise<SecurityAlert> {
    const priority = this.determinePriority(event.severity);
    const alertNumber = this.generateAlertNumber();

    const alert = this.alertRepo.create({
      alertNumber,
      title: `Threat Detected: ${event.eventType}`,
      description: threatMatch.description,
      severity: event.severity,
      priority,
      status: AlertStatus.NEW,
      sourceEventIds: [event.id],
      affectedResources: event.resource ? [event.resource] : [],
      affectedUsers: event.userId ? [event.userId] : [],
      recommendedActions: this.generateRecommendations(event, threatMatch.matchedIndicators),
      metadata: {
        matchedIndicators: threatMatch.matchedIndicators.map((i) => ({
          type: i.type,
          value: i.value,
          confidence: i.confidence,
        })),
      },
    });

    const saved = await this.alertRepo.save(alert);

    // Update event with alert ID
    await this.eventRepo.update(event.id, { alertId: saved.id });

    // Send notifications
    await this.sendNotifications(saved);

    this.logger.log(`Created alert ${alertNumber} for event ${event.id}`);
    return saved;
  }

  /**
   * Create alert from anomaly detection
   */
  async createFromAnomaly(
    event: SecurityEvent,
    anomaly: AnomalyDetectionResult,
  ): Promise<SecurityAlert> {
    const severity = anomaly.score > 4 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM;
    const priority = this.determinePriority(severity);
    const alertNumber = this.generateAlertNumber();

    const alert = this.alertRepo.create({
      alertNumber,
      title: `Anomaly Detected: ${anomaly.metric}`,
      description: anomaly.description,
      severity,
      priority,
      status: AlertStatus.NEW,
      sourceEventIds: [event.id],
      affectedResources: event.resource ? [event.resource] : [],
      affectedUsers: event.userId ? [event.userId] : [],
      recommendedActions: [
        'Review recent activity for the affected user/resource',
        'Check for unauthorized access attempts',
        'Verify if this activity was expected',
      ],
      metadata: {
        anomalyDetails: {
          score: anomaly.score,
          threshold: anomaly.threshold,
          currentValue: anomaly.currentValue,
          expectedValue: anomaly.expectedValue,
          standardDeviation: anomaly.standardDeviation,
        },
      },
    });

    const saved = await this.alertRepo.save(alert);

    // Update event with alert ID
    await this.eventRepo.update(event.id, { alertId: saved.id });

    // Send notifications
    await this.sendNotifications(saved);

    this.logger.log(`Created anomaly alert ${alertNumber}`);
    return saved;
  }

  /**
   * Get alert by ID
   */
  async getAlert(id: string): Promise<SecurityAlert> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    return alert;
  }

  /**
   * Get alerts with filters
   */
  async getAlerts(filters: {
    status?: AlertStatus;
    severity?: SecuritySeverity;
    priority?: AlertPriority;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: SecurityAlert[]; total: number }> {
    const qb = this.alertRepo.createQueryBuilder('alert');

    if (filters.status) {
      qb.andWhere('alert.status = :status', { status: filters.status });
    }
    if (filters.severity) {
      qb.andWhere('alert.severity = :severity', { severity: filters.severity });
    }
    if (filters.priority) {
      qb.andWhere('alert.priority = :priority', { priority: filters.priority });
    }
    if (filters.assignedTo) {
      qb.andWhere('alert.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.startDate && filters.endDate) {
      qb.andWhere('alert.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [alerts, total] = await qb
      .orderBy('alert.createdAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getManyAndCount();

    return { alerts, total };
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<SecurityAlert> {
    const alert = await this.getAlert(id);
    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    return this.alertRepo.save(alert);
  }

  /**
   * Assign alert to investigator
   */
  async assignAlert(id: string, assignedTo: string): Promise<SecurityAlert> {
    const alert = await this.getAlert(id);
    alert.assignedTo = assignedTo;
    alert.status = AlertStatus.INVESTIGATING;
    return this.alertRepo.save(alert);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(
    id: string,
    resolvedBy: string,
    resolution: string,
    isFalsePositive: boolean,
  ): Promise<SecurityAlert> {
    const alert = await this.getAlert(id);
    alert.status = isFalsePositive ? AlertStatus.FALSE_POSITIVE : AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolution = resolution;
    alert.isFalsePositive = isFalsePositive;
    return this.alertRepo.save(alert);
  }

  /**
   * Escalate alert
   */
  async escalateAlert(id: string, reason: string): Promise<SecurityAlert> {
    const alert = await this.getAlert(id);
    alert.status = AlertStatus.ESCALATED;
    alert.escalationLevel += 1;
    alert.escalatedAt = new Date();

    // Add escalation note
    alert.notes.push({
      id: uuidv4(),
      authorId: 'system',
      content: `Escalated: ${reason}`,
      createdAt: new Date(),
    });

    const saved = await this.alertRepo.save(alert);

    // Send escalation notifications
    await this.sendEscalationNotification(saved, reason);

    return saved;
  }

  /**
   * Add note to alert
   */
  async addNote(id: string, authorId: string, content: string): Promise<SecurityAlert> {
    const alert = await this.getAlert(id);
    alert.notes.push({
      id: uuidv4(),
      authorId,
      content,
      createdAt: new Date(),
    });
    return this.alertRepo.save(alert);
  }

  /**
   * Get alert statistics
   */
  async getStatistics(): Promise<{
    totalAlerts: number;
    byStatus: Record<AlertStatus, number>;
    bySeverity: Record<SecuritySeverity, number>;
    byPriority: Record<AlertPriority, number>;
    averageResolutionTimeHours: number;
  }> {
    const alerts = await this.alertRepo.find();

    const stats = {
      totalAlerts: alerts.length,
      byStatus: {} as Record<AlertStatus, number>,
      bySeverity: {} as Record<SecuritySeverity, number>,
      byPriority: {} as Record<AlertPriority, number>,
      averageResolutionTimeHours: 0,
    };

    for (const status of Object.values(AlertStatus)) {
      stats.byStatus[status] = alerts.filter((a) => a.status === status).length;
    }
    for (const severity of Object.values(SecuritySeverity)) {
      stats.bySeverity[severity] = alerts.filter((a) => a.severity === severity).length;
    }
    for (const priority of Object.values(AlertPriority)) {
      stats.byPriority[priority] = alerts.filter((a) => a.priority === priority).length;
    }

    const resolved = alerts.filter((a) => a.resolvedAt);
    if (resolved.length > 0) {
      const totalTime = resolved.reduce((sum, a) => {
        return sum + (a.resolvedAt!.getTime() - a.createdAt.getTime());
      }, 0);
      stats.averageResolutionTimeHours = totalTime / resolved.length / (1000 * 60 * 60);
    }

    return stats;
  }

  /**
   * Determine priority based on severity
   */
  private determinePriority(severity: SecuritySeverity): AlertPriority {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return AlertPriority.P1;
      case SecuritySeverity.HIGH:
        return AlertPriority.P2;
      case SecuritySeverity.MEDIUM:
        return AlertPriority.P3;
      default:
        return AlertPriority.P4;
    }
  }

  /**
   * Generate alert number
   */
  private generateAlertNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SEC-${year}${month}${day}-${random}`;
  }

  /**
   * Generate recommendations based on event and indicators
   */
  private generateRecommendations(
    event: SecurityEvent,
    indicators: ThreatIndicator[],
  ): string[] {
    const recommendations: string[] = [];

    if (event.ipAddress) {
      recommendations.push(`Block IP address ${event.ipAddress} if confirmed malicious`);
    }

    if (event.userId) {
      recommendations.push('Review user account for unauthorized access');
      recommendations.push('Consider resetting user credentials');
    }

    for (const indicator of indicators) {
      if (indicator.type === 'ip_address') {
        recommendations.push('Add IP to firewall blocklist');
      }
      if (indicator.type === 'pattern') {
        recommendations.push('Review application logs for similar patterns');
      }
    }

    recommendations.push('Document incident and escalate if necessary');

    return recommendations;
  }

  /**
   * Send alert notifications
   */
  private async sendNotifications(alert: SecurityAlert): Promise<void> {
    const alertingEnabled = this.configService.get('alerting.enabled', true);
    if (!alertingEnabled) return;

    // Log notification (actual implementation would send to Slack, PagerDuty, etc.)
    this.logger.log(`Alert notification sent: ${alert.alertNumber} - ${alert.title}`);

    // TODO: Implement actual notification channels
    // - Slack webhook
    // - PagerDuty
    // - Email
  }

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(alert: SecurityAlert, reason: string): Promise<void> {
    this.logger.log(`Escalation notification: ${alert.alertNumber} - Level ${alert.escalationLevel}`);
    // TODO: Implement actual escalation notification
  }
}


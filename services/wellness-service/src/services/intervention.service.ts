import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WellnessIntervention } from '../entities/wellness-intervention.entity';
import { WellnessCheckin } from '../entities/wellness-checkin.entity';
import { BurnoutRisk } from '../entities/burnout-risk.entity';
import {
  WellnessAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../entities/wellness-alert.entity';
import { InterventionType } from '../enums/recommendation-type.enum';

export enum InterventionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

interface InterventionTrigger {
  type: InterventionType;
  condition: 'stress_high' | 'sleep_low' | 'burnout_risk' | 'missed_checkin' | 'inactivity';
  threshold: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  action: string;
  cooldownHours: number;
}

interface InterventionResult {
  triggered: boolean;
  interventions: WellnessIntervention[];
  alerts: WellnessAlert[];
}

@Injectable()
export class InterventionService {
  private readonly logger = new Logger(InterventionService.name);
  private readonly interventionRules: InterventionTrigger[];

  constructor(
    @InjectRepository(WellnessIntervention)
    private readonly interventionRepo: Repository<WellnessIntervention>,
    @InjectRepository(WellnessCheckin)
    private readonly checkinRepo: Repository<WellnessCheckin>,
    @InjectRepository(BurnoutRisk)
    private readonly burnoutRepo: Repository<BurnoutRisk>,
    @InjectRepository(WellnessAlert)
    private readonly alertRepo: Repository<WellnessAlert>,
  ) {
    this.interventionRules = this.initializeInterventionRules();
  }

  private initializeInterventionRules(): InterventionTrigger[] {
    return [
      {
        type: InterventionType.BREATHING_EXERCISE,
        condition: 'stress_high',
        threshold: 7,
        priority: 'high',
        message: 'Your stress level seems elevated. Try a quick breathing exercise.',
        action: 'Start 5-minute breathing exercise',
        cooldownHours: 4,
      },
      {
        type: InterventionType.MINDFULNESS,
        condition: 'stress_high',
        threshold: 8,
        priority: 'urgent',
        message: 'High stress detected. A mindfulness break can help.',
        action: 'Begin guided meditation',
        cooldownHours: 2,
      },
      {
        type: InterventionType.SLEEP_HYGIENE,
        condition: 'sleep_low',
        threshold: 4,
        priority: 'medium',
        message: 'Your sleep quality has been low. Review sleep tips.',
        action: 'View sleep improvement guide',
        cooldownHours: 24,
      },
      {
        type: InterventionType.PROFESSIONAL_SUPPORT,
        condition: 'burnout_risk',
        threshold: 75,
        priority: 'urgent',
        message: 'You may be experiencing burnout. Consider speaking with support.',
        action: 'Connect with wellness support',
        cooldownHours: 48,
      },
      {
        type: InterventionType.BREAK_REMINDER,
        condition: 'burnout_risk',
        threshold: 50,
        priority: 'medium',
        message: 'Time for a break. Step away for a few minutes.',
        action: 'Start break timer',
        cooldownHours: 2,
      },
    ];
  }

  /**
   * Evaluate and trigger interventions based on user's current wellness state
   */
  async evaluateAndTrigger(userId: string): Promise<InterventionResult> {
    const interventions: WellnessIntervention[] = [];
    const alerts: WellnessAlert[] = [];

    // Get latest check-in
    const latestCheckin = await this.checkinRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Get latest burnout risk
    const latestBurnout = await this.burnoutRepo.findOne({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    });

    // Evaluate each intervention rule
    for (const rule of this.interventionRules) {
      const shouldTrigger = await this.evaluateRule(
        userId,
        rule,
        latestCheckin,
        latestBurnout,
      );

      if (shouldTrigger) {
        const intervention = await this.createIntervention(userId, rule);
        interventions.push(intervention);

        // Create alert for high priority interventions
        if (rule.priority === 'high' || rule.priority === 'urgent') {
          const alert = await this.createAlert(userId, rule, intervention);
          alerts.push(alert);
        }
      }
    }

    return {
      triggered: interventions.length > 0,
      interventions,
      alerts,
    };
  }

  private async evaluateRule(
    userId: string,
    rule: InterventionTrigger,
    checkin: WellnessCheckin | null,
    burnout: BurnoutRisk | null,
  ): Promise<boolean> {
    // Check cooldown
    const cooldownExpiry = new Date();
    cooldownExpiry.setHours(cooldownExpiry.getHours() - rule.cooldownHours);

    const recentIntervention = await this.interventionRepo.findOne({
      where: {
        userId,
        type: rule.type,
        createdAt: LessThan(cooldownExpiry),
      },
    });

    if (recentIntervention) {
      return false;
    }

    switch (rule.condition) {
      case 'stress_high':
        return checkin ? checkin.stressLevel >= rule.threshold : false;
      case 'sleep_low':
        return checkin ? checkin.sleepQuality <= rule.threshold : false;
      case 'burnout_risk':
        return burnout ? burnout.burnoutScore >= rule.threshold : false;
      case 'missed_checkin':
        if (!checkin) return true;
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return checkin.createdAt < oneDayAgo;
      default:
        return false;
    }
  }

  private async createIntervention(
    userId: string,
    rule: InterventionTrigger,
  ): Promise<WellnessIntervention> {
    const intervention = this.interventionRepo.create({
      userId,
      type: rule.type,
      trigger: rule.condition,
      content: rule.message,
      priority: rule.priority,
      status: 'pending',
      metadata: {
        ruleCondition: rule.condition,
        ruleThreshold: rule.threshold,
        suggestedAction: rule.action,
      },
    });

    await this.interventionRepo.save(intervention);
    this.logger.log(`Intervention ${rule.type} created for user ${userId}`);

    return intervention;
  }

  private async createAlert(
    userId: string,
    rule: InterventionTrigger,
    intervention: WellnessIntervention,
  ): Promise<WellnessAlert> {
    const severity =
      rule.priority === 'urgent'
        ? AlertSeverity.CRITICAL
        : AlertSeverity.WARNING;

    const alertType = this.mapRuleToAlertType(rule.condition);

    const alert = this.alertRepo.create({
      userId,
      alertType,
      severity,
      status: AlertStatus.ACTIVE,
      title: `Wellness Intervention: ${rule.type.replace('_', ' ')}`,
      message: rule.message,
      data: {
        interventionId: intervention.id,
        interventionType: rule.type,
        action: rule.action,
      },
    });

    await this.alertRepo.save(alert);
    return alert;
  }

  private mapRuleToAlertType(condition: string): AlertType {
    switch (condition) {
      case 'stress_high':
        return AlertType.STRESS_LEVEL;
      case 'sleep_low':
        return AlertType.SLEEP_QUALITY;
      case 'burnout_risk':
        return AlertType.BURNOUT_RISK;
      case 'missed_checkin':
        return AlertType.CHECK_IN_MISSED;
      default:
        return AlertType.WELLNESS_SCORE;
    }
  }

  /**
   * Get pending interventions for a user
   */
  async getPendingInterventions(userId: string): Promise<WellnessIntervention[]> {
    return this.interventionRepo.find({
      where: { userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mark intervention as engaged
   */
  async completeIntervention(
    userId: string,
    interventionId: string,
    feedback?: string,
  ): Promise<WellnessIntervention> {
    const intervention = await this.interventionRepo.findOne({
      where: { id: interventionId, userId },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention not found');
    }

    intervention.status = 'engaged';
    intervention.engagedAt = new Date();
    if (feedback) {
      intervention.feedback = feedback;
    }

    await this.interventionRepo.save(intervention);

    // Also resolve any related alerts
    await this.alertRepo.update(
      {
        userId,
        status: AlertStatus.ACTIVE,
      },
      {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolutionNotes: 'Intervention completed',
      },
    );

    return intervention;
  }

  /**
   * Dismiss an intervention
   */
  async dismissIntervention(
    userId: string,
    interventionId: string,
    reason?: string,
  ): Promise<WellnessIntervention> {
    const intervention = await this.interventionRepo.findOne({
      where: { id: interventionId, userId },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention not found');
    }

    intervention.status = 'dismissed';
    if (reason) {
      intervention.metadata = { ...intervention.metadata, dismissReason: reason };
    }

    return this.interventionRepo.save(intervention);
  }

  /**
   * Get user's active alerts
   */
  async getActiveAlerts(userId: string): Promise<WellnessAlert[]> {
    return this.alertRepo.find({
      where: { userId, status: AlertStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(userId: string, alertId: string): Promise<WellnessAlert> {
    const alert = await this.alertRepo.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    return this.alertRepo.save(alert);
  }

  /**
   * Scheduled job to evaluate interventions for all active users
   */
  @Cron(CronExpression.EVERY_HOUR)
  async evaluateAllUsers(): Promise<void> {
    this.logger.log('Starting scheduled intervention evaluation');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const activeUsers = await this.checkinRepo
      .createQueryBuilder('checkin')
      .select('DISTINCT checkin.userId', 'userId')
      .where('checkin.createdAt >= :oneDayAgo', { oneDayAgo })
      .getRawMany();

    let triggeredCount = 0;
    for (const { userId } of activeUsers) {
      try {
        const result = await this.evaluateAndTrigger(userId);
        if (result.triggered) triggeredCount++;
      } catch (error) {
        this.logger.error(`Failed to evaluate user ${userId}`, error);
      }
    }

    this.logger.log(
      `Scheduled evaluation complete: ${triggeredCount} interventions triggered for ${activeUsers.length} users`,
    );
  }

  /**
   * Get intervention statistics for a user
   */
  async getInterventionStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    engaged: number;
    dismissed: number;
    pending: number;
    byType: Record<string, number>;
    engagementRate: number;
  }> {
    const where: any = { userId };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const interventions = await this.interventionRepo.find({ where });

    const byType: Record<string, number> = {};
    for (const intervention of interventions) {
      byType[intervention.type] = (byType[intervention.type] || 0) + 1;
    }

    const engaged = interventions.filter(i => i.status === 'engaged').length;
    const dismissed = interventions.filter(i => i.status === 'dismissed').length;
    const pending = interventions.filter(i => i.status === 'pending').length;

    return {
      total: interventions.length,
      engaged,
      dismissed,
      pending,
      byType,
      engagementRate: interventions.length > 0
        ? Math.round((engaged / interventions.length) * 100)
        : 0,
    };
  }
}

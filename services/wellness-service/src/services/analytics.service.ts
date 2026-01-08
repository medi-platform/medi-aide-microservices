import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WellnessCheckin } from '../entities/wellness-checkin.entity';
import { BurnoutRisk } from '../entities/burnout-risk.entity';
import { WellnessGoal, GoalStatus } from '../entities/wellness-goal.entity';
import {
  WellnessAnalytics,
  AnalyticsPeriod,
} from '../entities/wellness-analytics.entity';

interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  significance: 'low' | 'medium' | 'high';
}

interface WellnessInsight {
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

interface AnalyticsSummary {
  period: AnalyticsPeriod;
  periodStart: Date;
  periodEnd: Date;
  overallScore: number;
  trend: TrendAnalysis;
  categories: {
    stress: { score: number; trend: TrendAnalysis };
    sleep: { score: number; trend: TrendAnalysis };
    activity: { score: number; trend: TrendAnalysis };
    burnout: { score: number; trend: TrendAnalysis };
  };
  insights: WellnessInsight[];
  goalProgress: {
    completed: number;
    inProgress: number;
    failed: number;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(WellnessCheckin)
    private readonly checkinRepo: Repository<WellnessCheckin>,
    @InjectRepository(BurnoutRisk)
    private readonly burnoutRepo: Repository<BurnoutRisk>,
    @InjectRepository(WellnessGoal)
    private readonly goalRepo: Repository<WellnessGoal>,
    @InjectRepository(WellnessAnalytics)
    private readonly analyticsRepo: Repository<WellnessAnalytics>,
  ) {}

  /**
   * Get wellness analytics summary for a user
   */
  async getAnalyticsSummary(
    userId: string,
    period: AnalyticsPeriod = AnalyticsPeriod.WEEKLY,
  ): Promise<AnalyticsSummary> {
    const { startDate, endDate } = this.getPeriodDates(period);
    const previousPeriod = this.getPreviousPeriodDates(period, startDate);

    // Get current period data
    const currentCheckins = await this.getCheckins(userId, startDate, endDate);
    const currentBurnout = await this.getBurnoutData(userId, startDate, endDate);
    const goals = await this.getGoalProgress(userId);

    // Get previous period for comparison
    const previousCheckins = await this.getCheckins(
      userId,
      previousPeriod.startDate,
      previousPeriod.endDate,
    );

    // Calculate scores
    const stressScore = this.calculateStressScore(currentCheckins);
    const sleepScore = this.calculateSleepScore(currentCheckins);
    const activityScore = 50; // Placeholder - would use wearable data
    const burnoutScore = this.calculateBurnoutScore(currentBurnout);

    const overallScore = this.calculateOverallScore({
      stress: stressScore,
      sleep: sleepScore,
      activity: activityScore,
      burnout: burnoutScore,
    });

    // Calculate trends
    const previousStress = this.calculateStressScore(previousCheckins);
    const trend = this.analyzeTrend(overallScore, this.calculateOverallScore({
      stress: previousStress,
      sleep: 50,
      activity: 50,
      burnout: 50,
    }));

    // Generate insights
    const insights = this.generateInsights({
      stressScore,
      sleepScore,
      activityScore,
      burnoutScore,
      overallScore,
      checkinCount: currentCheckins.length,
    });

    return {
      period,
      periodStart: startDate,
      periodEnd: endDate,
      overallScore,
      trend,
      categories: {
        stress: {
          score: stressScore,
          trend: this.analyzeTrend(stressScore, previousStress),
        },
        sleep: {
          score: sleepScore,
          trend: { direction: 'stable', changePercentage: 0, significance: 'low' },
        },
        activity: {
          score: activityScore,
          trend: { direction: 'stable', changePercentage: 0, significance: 'low' },
        },
        burnout: {
          score: burnoutScore,
          trend: { direction: 'stable', changePercentage: 0, significance: 'low' },
        },
      },
      insights,
      goalProgress: goals,
    };
  }

  /**
   * Generate and store analytics for all users (daily job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateDailyAnalytics(): Promise<void> {
    this.logger.log('Starting daily analytics generation');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique users with check-ins in the last day
    const users = await this.checkinRepo
      .createQueryBuilder('checkin')
      .select('DISTINCT checkin.userId', 'userId')
      .where('checkin.createdAt >= :yesterday', { yesterday })
      .getRawMany();

    for (const { userId } of users) {
      try {
        await this.generateUserAnalytics(userId, AnalyticsPeriod.DAILY, yesterday, today);
      } catch (error) {
        this.logger.error(`Failed to generate analytics for user ${userId}`, error);
      }
    }

    this.logger.log(`Daily analytics generated for ${users.length} users`);
  }

  /**
   * Generate analytics for a specific user and period
   */
  async generateUserAnalytics(
    userId: string,
    period: AnalyticsPeriod,
    startDate: Date,
    endDate: Date,
  ): Promise<WellnessAnalytics> {
    const checkins = await this.getCheckins(userId, startDate, endDate);
    const burnoutData = await this.getBurnoutData(userId, startDate, endDate);
    const goals = await this.getGoalProgress(userId);

    const stressScore = this.calculateStressScore(checkins);
    const sleepScore = this.calculateSleepScore(checkins);
    const activityScore = 50;
    const burnoutScore = this.calculateBurnoutScore(burnoutData);

    const insights = this.generateInsights({
      stressScore,
      sleepScore,
      activityScore,
      burnoutScore,
      overallScore: this.calculateOverallScore({ stress: stressScore, sleep: sleepScore, activity: activityScore, burnout: burnoutScore }),
      checkinCount: checkins.length,
    });

    // Create or update analytics record
    let analytics = await this.analyticsRepo.findOne({
      where: {
        userId,
        period,
        periodStart: startDate,
      },
    });

    if (!analytics) {
      analytics = this.analyticsRepo.create({
        userId,
        period,
        periodStart: startDate,
        periodEnd: endDate,
      });
    }

    analytics.avgWellnessScore = this.calculateOverallScore({
      stress: stressScore,
      sleep: sleepScore,
      activity: activityScore,
      burnout: burnoutScore,
    });
    analytics.avgStressLevel = stressScore;
    analytics.avgSleepQuality = sleepScore;
    analytics.avgActivityScore = activityScore;
    analytics.burnoutRiskScore = burnoutScore;
    analytics.checkInCount = checkins.length;
    analytics.goalsCompleted = goals.completed;
    analytics.goalsFailed = goals.failed;
    analytics.insights = insights;

    return this.analyticsRepo.save(analytics);
  }

  /**
   * Get predictive wellness score
   */
  async getPredictiveAnalytics(userId: string): Promise<{
    predictedScore: number;
    confidence: number;
    factors: { name: string; impact: number; direction: 'positive' | 'negative' }[];
    recommendations: string[];
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalAnalytics = await this.analyticsRepo.find({
      where: {
        userId,
        periodStart: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { periodStart: 'ASC' },
    });

    if (historicalAnalytics.length < 7) {
      return {
        predictedScore: 65,
        confidence: 0.3,
        factors: [],
        recommendations: ['Continue daily check-ins for more accurate predictions'],
      };
    }

    const scores = historicalAnalytics.map(a => Number(a.avgWellnessScore) || 50);
    const { slope, intercept } = this.linearRegression(scores);
    const predictedScore = Math.min(100, Math.max(0, intercept + slope * (scores.length + 7)));

    const latestAnalytics = historicalAnalytics[historicalAnalytics.length - 1];
    const factors = this.analyzeFactors(latestAnalytics);
    const recommendations = this.generatePredictiveRecommendations(factors, predictedScore);

    return {
      predictedScore: Math.round(predictedScore),
      confidence: Math.min(0.9, 0.3 + historicalAnalytics.length * 0.02),
      factors,
      recommendations,
    };
  }

  /**
   * Get trend analysis for a specific metric
   */
  async getMetricTrend(
    userId: string,
    metric: 'stress' | 'sleep' | 'activity' | 'burnout' | 'overall',
    days: number = 30,
  ): Promise<{
    dataPoints: { date: string; value: number }[];
    trend: TrendAnalysis;
    average: number;
    min: number;
    max: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.analyticsRepo.find({
      where: {
        userId,
        period: AnalyticsPeriod.DAILY,
        periodStart: MoreThanOrEqual(startDate),
      },
      order: { periodStart: 'ASC' },
    });

    const dataPoints = analytics.map(a => ({
      date: a.periodStart.toISOString().split('T')[0],
      value: this.getMetricValue(a, metric),
    }));

    const values = dataPoints.map(d => d.value);
    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      dataPoints,
      trend: this.analyzeTrendFromValues(values),
      average: Math.round(average * 100) / 100,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    };
  }

  // Helper methods

  private getPeriodDates(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case AnalyticsPeriod.DAILY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case AnalyticsPeriod.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case AnalyticsPeriod.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case AnalyticsPeriod.QUARTERLY:
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  }

  private getPreviousPeriodDates(
    period: AnalyticsPeriod,
    currentStart: Date,
  ): { startDate: Date; endDate: Date } {
    const endDate = new Date(currentStart);
    const startDate = new Date(currentStart);

    switch (period) {
      case AnalyticsPeriod.DAILY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case AnalyticsPeriod.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case AnalyticsPeriod.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case AnalyticsPeriod.QUARTERLY:
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  }

  private async getCheckins(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WellnessCheckin[]> {
    return this.checkinRepo.find({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
    });
  }

  private async getBurnoutData(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BurnoutRisk[]> {
    return this.burnoutRepo.find({
      where: {
        userId,
        calculatedAt: Between(startDate, endDate),
      },
    });
  }

  private async getGoalProgress(userId: string): Promise<{ completed: number; inProgress: number; failed: number }> {
    const goals = await this.goalRepo.find({ where: { userId } });

    return {
      completed: goals.filter(g => g.status === GoalStatus.COMPLETED).length,
      inProgress: goals.filter(g => g.status === GoalStatus.ACTIVE).length,
      failed: goals.filter(g => g.status === GoalStatus.FAILED).length,
    };
  }

  private calculateStressScore(checkins: WellnessCheckin[]): number {
    if (checkins.length === 0) return 50;
    const avgStress = checkins.reduce((sum, c) => sum + (c.stressLevel || 5), 0) / checkins.length;
    return Math.round((10 - avgStress) * 10);
  }

  private calculateSleepScore(checkins: WellnessCheckin[]): number {
    if (checkins.length === 0) return 50;
    const avgSleep = checkins.reduce((sum, c) => sum + (c.sleepQuality || 5), 0) / checkins.length;
    return Math.round(avgSleep * 10);
  }

  private calculateBurnoutScore(burnoutData: BurnoutRisk[]): number {
    if (burnoutData.length === 0) return 70;
    const avgBurnout = burnoutData.reduce((sum, b) => sum + b.burnoutScore, 0) / burnoutData.length;
    return Math.round(100 - avgBurnout);
  }

  private calculateOverallScore(scores: {
    stress: number;
    sleep: number;
    activity: number;
    burnout: number;
  }): number {
    const weights = { stress: 0.3, sleep: 0.25, activity: 0.2, burnout: 0.25 };
    return Math.round(
      scores.stress * weights.stress +
      scores.sleep * weights.sleep +
      scores.activity * weights.activity +
      scores.burnout * weights.burnout
    );
  }

  private analyzeTrend(current: number, previous: number): TrendAnalysis {
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

    let direction: 'improving' | 'stable' | 'declining';
    if (changePercentage > 5) direction = 'improving';
    else if (changePercentage < -5) direction = 'declining';
    else direction = 'stable';

    const significance: 'low' | 'medium' | 'high' =
      Math.abs(changePercentage) > 20 ? 'high' :
      Math.abs(changePercentage) > 10 ? 'medium' : 'low';

    return { direction, changePercentage: Math.round(changePercentage), significance };
  }

  private analyzeTrendFromValues(values: number[]): TrendAnalysis {
    if (values.length < 2) {
      return { direction: 'stable', changePercentage: 0, significance: 'low' };
    }
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
    return this.analyzeTrend(avgSecond, avgFirst);
  }

  private generateInsights(metrics: {
    stressScore: number;
    sleepScore: number;
    activityScore: number;
    burnoutScore: number;
    overallScore: number;
    checkinCount: number;
  }): WellnessInsight[] {
    const insights: WellnessInsight[] = [];

    if (metrics.stressScore < 40) {
      insights.push({
        type: 'stress_alert',
        message: 'Your stress levels have been elevated this period',
        priority: 'high',
        actionable: true,
        recommendation: 'Consider taking breaks and practicing mindfulness exercises',
      });
    }

    if (metrics.sleepScore < 50) {
      insights.push({
        type: 'sleep_quality',
        message: 'Your sleep quality could be improved',
        priority: 'medium',
        actionable: true,
        recommendation: 'Try maintaining a consistent sleep schedule',
      });
    }

    if (metrics.burnoutScore < 40) {
      insights.push({
        type: 'burnout_risk',
        message: 'You may be at risk of burnout',
        priority: 'high',
        actionable: true,
        recommendation: 'Consider speaking with a supervisor about workload management',
      });
    }

    if (metrics.checkinCount < 3) {
      insights.push({
        type: 'engagement',
        message: 'Regular check-ins help track your wellness more accurately',
        priority: 'low',
        actionable: true,
        recommendation: 'Try to complete at least one wellness check-in per day',
      });
    }

    if (metrics.overallScore >= 80) {
      insights.push({
        type: 'positive_feedback',
        message: 'Great job maintaining your wellness this period!',
        priority: 'low',
        actionable: false,
      });
    }

    return insights;
  }

  private linearRegression(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 50 };

    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private analyzeFactors(analytics: WellnessAnalytics): {
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
  }[] {
    const factors = [];

    if (analytics.avgStressLevel) {
      factors.push({
        name: 'Stress Level',
        impact: Math.abs(50 - Number(analytics.avgStressLevel)),
        direction: (Number(analytics.avgStressLevel) > 50 ? 'positive' : 'negative') as 'positive' | 'negative',
      });
    }

    if (analytics.avgSleepQuality) {
      factors.push({
        name: 'Sleep Quality',
        impact: Math.abs(50 - Number(analytics.avgSleepQuality)),
        direction: (Number(analytics.avgSleepQuality) > 50 ? 'positive' : 'negative') as 'positive' | 'negative',
      });
    }

    return factors.sort((a, b) => b.impact - a.impact);
  }

  private generatePredictiveRecommendations(
    factors: { name: string; impact: number; direction: 'positive' | 'negative' }[],
    predictedScore: number,
  ): string[] {
    const recommendations: string[] = [];

    const negativeFactors = factors.filter(f => f.direction === 'negative');
    for (const factor of negativeFactors.slice(0, 2)) {
      if (factor.name === 'Stress Level') {
        recommendations.push('Focus on stress management techniques this week');
      }
      if (factor.name === 'Sleep Quality') {
        recommendations.push('Prioritize getting 7-8 hours of quality sleep');
      }
    }

    if (predictedScore < 50) {
      recommendations.push('Consider speaking with a wellness coach');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work with your wellness routine!');
    }

    return recommendations;
  }

  private getMetricValue(analytics: WellnessAnalytics, metric: string): number {
    switch (metric) {
      case 'stress': return Number(analytics.avgStressLevel) || 50;
      case 'sleep': return Number(analytics.avgSleepQuality) || 50;
      case 'activity': return Number(analytics.avgActivityScore) || 50;
      case 'burnout': return Number(analytics.burnoutRiskScore) || 50;
      case 'overall': return Number(analytics.avgWellnessScore) || 50;
      default: return 50;
    }
  }
}

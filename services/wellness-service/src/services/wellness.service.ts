import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { WellnessMetric } from '../entities/wellness-metric.entity';
import { WellnessCheckin } from '../entities/wellness-checkin.entity';
import { BurnoutRisk } from '../entities/burnout-risk.entity';

import { BurnoutRiskLabel } from '../interfaces/wellness-types.interface';

interface BurnoutAnalysisResult {
  userId: string;
  overallScore: number;
  categories: {
    workload: number;
    emotionalExhaustion: number;
    personalAchievement: number;
    depersonalization: number;
  };
  riskLevel: BurnoutRiskLabel;
  recommendations: string[];
  analyzedAt: Date;
}

@Injectable()
export class WellnessService {
  private readonly logger = new Logger(WellnessService.name);

  constructor(
    @InjectRepository(WellnessMetric)
    private readonly metricRepo: Repository<WellnessMetric>,
    @InjectRepository(WellnessCheckin)
    private readonly checkinRepo: Repository<WellnessCheckin>,
    @InjectRepository(BurnoutRisk)
    private readonly burnoutRepo: Repository<BurnoutRisk>,
  ) {}

  async getUserMetrics(userId: string) {
    return this.metricRepo.find({
      where: { userId },
      take: 100,
      order: { recordedAt: 'DESC' },
    });
  }

  async recordMetric(data: any) {
    const metric = this.metricRepo.create({
      ...data,
      recordedAt: new Date(),
    });
    return this.metricRepo.save(metric);
  }

  /**
   * Analyze burnout risk based on recent check-ins and historical data
   */
  async analyzeBurnout(userId: string): Promise<BurnoutAnalysisResult> {
    // Get recent check-ins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCheckins = await this.checkinRepo.find({
      where: {
        userId,
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { createdAt: 'DESC' },
    });

    // Get most recent burnout assessment
    const latestBurnout = await this.burnoutRepo.findOne({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    });

    // Calculate category scores from check-in data
    const categories = this.calculateCategoryScores(recentCheckins);

    // Calculate overall burnout score (0-100, higher = more burnout risk)
    const overallScore = this.calculateOverallBurnoutScore(categories);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore);

    // Generate personalized recommendations
    const recommendations = this.generateRecommendations(categories, riskLevel);

    // Save the burnout assessment
    const burnoutRecord = this.burnoutRepo.create({
      userId,
      burnoutScore: overallScore,
      label: riskLevel,
      colorScheme: this.getRiskColor(riskLevel),
      advice: recommendations[0] || 'Maintain your current wellness practices.',
      factors: categories,
      recommendations,
      calculatedAt: new Date(),
    });
    await this.burnoutRepo.save(burnoutRecord);

    this.logger.log(`Burnout analysis completed for user ${userId}: score=${overallScore}, level=${riskLevel}`);

    return {
      userId,
      overallScore,
      categories,
      riskLevel,
      recommendations,
      analyzedAt: new Date(),
    };
  }

  private calculateCategoryScores(checkins: WellnessCheckin[]): BurnoutAnalysisResult['categories'] {
    if (checkins.length === 0) {
      return {
        workload: 50,
        emotionalExhaustion: 50,
        personalAchievement: 50,
        depersonalization: 50,
      };
    }

    // Calculate averages from check-in data
    const avgStress = this.average(checkins.map(c => c.stressLevel || 5));
    const avgEnergy = this.average(checkins.map(c => c.energyLevel || 5));
    const avgSleep = this.average(checkins.map(c => c.sleepQuality || 5));

    // Map check-in metrics to burnout categories
    // Higher stress = higher workload perception
    const workload = Math.min(100, avgStress * 10);

    // Low energy and poor sleep contribute to emotional exhaustion
    const emotionalExhaustion = Math.min(100, ((10 - avgEnergy) * 5) + ((10 - avgSleep) * 5));

    // Good energy levels indicate personal achievement
    const personalAchievement = Math.max(0, avgEnergy * 10);

    // Low mood variety and persistent issues indicate depersonalization
    const moodVariety = this.calculateMoodVariety(checkins);
    const depersonalization = Math.max(0, 100 - moodVariety);

    return {
      workload: Math.round(workload),
      emotionalExhaustion: Math.round(emotionalExhaustion),
      personalAchievement: Math.round(personalAchievement),
      depersonalization: Math.round(depersonalization),
    };
  }

  private calculateMoodVariety(checkins: WellnessCheckin[]): number {
    if (checkins.length < 3) return 50;

    const moods = checkins.map(c => c.mood).filter(Boolean);
    const uniqueMoods = new Set(moods);
    return Math.min(100, (uniqueMoods.size / moods.length) * 100);
  }

  private calculateOverallBurnoutScore(categories: BurnoutAnalysisResult['categories']): number {
    // Weighted calculation (lower personal achievement increases burnout)
    const weights = {
      workload: 0.25,
      emotionalExhaustion: 0.35,
      personalAchievement: -0.2, // Inverse: high achievement reduces burnout
      depersonalization: 0.2,
    };

    const score =
      categories.workload * weights.workload +
      categories.emotionalExhaustion * weights.emotionalExhaustion +
      (100 - categories.personalAchievement) * Math.abs(weights.personalAchievement) +
      categories.depersonalization * weights.depersonalization;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private determineRiskLevel(score: number): BurnoutRiskLabel {
    if (score <= 25) return 'Low';
    if (score <= 50) return 'Medium';
    if (score <= 75) return 'High';
    return 'Critical';
  }

  private getRiskColor(level: BurnoutRiskLabel): string {
    switch (level) {
      case 'Low': return 'green';
      case 'Medium': return 'yellow';
      case 'High': return 'orange';
      case 'Critical': return 'red';
    }
  }

  private generateRecommendations(
    categories: BurnoutAnalysisResult['categories'],
    riskLevel: BurnoutRiskLabel,
  ): string[] {
    const recommendations: string[] = [];

    // Workload recommendations
    if (categories.workload > 70) {
      recommendations.push('Consider discussing workload distribution with your supervisor');
      recommendations.push('Prioritize tasks and delegate when possible');
    } else if (categories.workload > 50) {
      recommendations.push('Take regular breaks throughout your shift');
    }

    // Emotional exhaustion recommendations
    if (categories.emotionalExhaustion > 70) {
      recommendations.push('Practice mindfulness or meditation daily');
      recommendations.push('Seek support from colleagues or a counselor');
    } else if (categories.emotionalExhaustion > 50) {
      recommendations.push('Incorporate stress-relief activities into your routine');
    }

    // Personal achievement recommendations
    if (categories.personalAchievement < 40) {
      recommendations.push('Set small, achievable goals to build momentum');
      recommendations.push('Celebrate your daily accomplishments, no matter how small');
    }

    // Depersonalization recommendations
    if (categories.depersonalization > 60) {
      recommendations.push('Reconnect with why you chose caregiving as a profession');
      recommendations.push('Spend quality time with supportive friends or family');
    }

    // Risk level specific recommendations
    if (riskLevel === 'Critical') {
      recommendations.unshift('Consider taking time off to recover');
      recommendations.push('Speak with a mental health professional');
    } else if (riskLevel === 'High') {
      recommendations.push('Maintain strict work-life boundaries');
    }

    // Ensure at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push('Continue your positive wellness practices');
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { MatchHistory, MatchOutcome } from '../entities/match-history.entity';

interface HistoricalMatchStats {
  totalMatches: number;
  completedMatches: number;
  averageRating: number;
  averageDuration: number;
  completionRate: number;
  issueRate: number;
}

interface CaregiverPerformance {
  caregiverId: string;
  totalMatches: number;
  successRate: number;
  averageRating: number;
  repeatClientRate: number;
  recommendations: string[];
}

interface PatientPreferences {
  patientId: string;
  preferredCaregivers: string[];
  avoidCaregivers: string[];
  insights: string[];
}

@Injectable()
export class MatchHistoryService {
  private readonly logger = new Logger(MatchHistoryService.name);

  constructor(
    @InjectRepository(MatchHistory)
    private readonly historyRepo: Repository<MatchHistory>,
  ) {}

  /**
   * Record a new match for historical tracking
   */
  async recordMatch(data: {
    caregiverId: string;
    patientId: string;
    careRequestId: string;
    matchId?: string;
    initialScore: number;
  }): Promise<MatchHistory> {
    const history = this.historyRepo.create({
      ...data,
      outcome: MatchOutcome.IN_PROGRESS,
      startedAt: new Date(),
    });

    return this.historyRepo.save(history);
  }

  /**
   * Update match outcome
   */
  async updateOutcome(
    matchId: string,
    outcome: MatchOutcome,
    details?: {
      patientRating?: number;
      caregiverRating?: number;
      durationHours?: number;
      visitsCompleted?: number;
      issuesReported?: number;
      feedback?: string;
    },
  ): Promise<MatchHistory> {
    const history = await this.historyRepo.findOne({
      where: { matchId },
    });

    if (!history) {
      throw new Error(`Match history not found for match ${matchId}`);
    }

    history.outcome = outcome;
    history.endedAt = new Date();

    if (details) {
      if (details.patientRating !== undefined) history.patientRating = details.patientRating;
      if (details.caregiverRating !== undefined) history.caregiverRating = details.caregiverRating;
      if (details.durationHours !== undefined) history.durationHours = details.durationHours;
      if (details.visitsCompleted !== undefined) history.visitsCompleted = details.visitsCompleted;
      if (details.issuesReported !== undefined) history.issuesReported = details.issuesReported;
      if (details.feedback) history.feedback = details.feedback;
    }

    return this.historyRepo.save(history);
  }

  /**
   * Get historical stats for a caregiver-patient pair
   */
  async getPairHistory(
    caregiverId: string,
    patientId: string,
  ): Promise<HistoricalMatchStats> {
    const history = await this.historyRepo.find({
      where: { caregiverId, patientId },
      order: { createdAt: 'DESC' },
    });

    return this.calculateStats(history);
  }

  /**
   * Get caregiver's overall performance
   */
  async getCaregiverPerformance(
    caregiverId: string,
    months: number = 12,
  ): Promise<CaregiverPerformance> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const history = await this.historyRepo.find({
      where: {
        caregiverId,
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    const stats = this.calculateStats(history);
    
    // Calculate repeat client rate
    const uniquePatients = new Set(history.map(h => h.patientId));
    const repeatPatients = new Set<string>();
    
    for (const patientId of uniquePatients) {
      const patientMatches = history.filter(h => h.patientId === patientId);
      if (patientMatches.length > 1) {
        repeatPatients.add(patientId);
      }
    }

    const repeatClientRate = uniquePatients.size > 0 
      ? repeatPatients.size / uniquePatients.size 
      : 0;

    const recommendations = this.generateCaregiverRecommendations(stats, repeatClientRate);

    return {
      caregiverId,
      totalMatches: stats.totalMatches,
      successRate: stats.completionRate,
      averageRating: stats.averageRating,
      repeatClientRate,
      recommendations,
    };
  }

  /**
   * Analyze patient preferences based on history
   */
  async analyzePatientPreferences(patientId: string): Promise<PatientPreferences> {
    const history = await this.historyRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });

    const caregiverStats = new Map<string, {
      matches: number;
      avgRating: number;
      completed: number;
      issues: number;
    }>();

    for (const match of history) {
      const existing = caregiverStats.get(match.caregiverId) || {
        matches: 0,
        avgRating: 0,
        completed: 0,
        issues: 0,
      };

      existing.matches++;
      if (match.patientRating) {
        existing.avgRating = (existing.avgRating * (existing.matches - 1) + Number(match.patientRating)) / existing.matches;
      }
      if (match.outcome === MatchOutcome.COMPLETED) existing.completed++;
      existing.issues += match.issuesReported;

      caregiverStats.set(match.caregiverId, existing);
    }

    const preferredCaregivers: string[] = [];
    const avoidCaregivers: string[] = [];
    const insights: string[] = [];

    for (const [caregiverId, stats] of caregiverStats.entries()) {
      if (stats.avgRating >= 4.5 && stats.completed > 0) {
        preferredCaregivers.push(caregiverId);
      }
      if (stats.avgRating <= 2 || stats.issues >= 3) {
        avoidCaregivers.push(caregiverId);
      }
    }

    if (preferredCaregivers.length > 0) {
      insights.push(`Patient has ${preferredCaregivers.length} preferred caregiver(s)`);
    }

    if (history.length > 10) {
      insights.push('Extensive matching history available for better predictions');
    }

    return {
      patientId,
      preferredCaregivers,
      avoidCaregivers,
      insights,
    };
  }

  /**
   * Get historical compatibility score boost/penalty
   */
  async getHistoricalBoost(
    caregiverId: string,
    patientId: string,
  ): Promise<{ boost: number; reason: string }> {
    const history = await this.historyRepo.find({
      where: { caregiverId, patientId },
    });

    if (history.length === 0) {
      return { boost: 0, reason: 'No prior history' };
    }

    const completedMatches = history.filter(h => h.outcome === MatchOutcome.COMPLETED);
    const avgRating = completedMatches
      .filter(h => h.patientRating)
      .reduce((sum, h) => sum + Number(h.patientRating), 0) / completedMatches.filter(h => h.patientRating).length || 0;

    if (completedMatches.length >= 3 && avgRating >= 4.5) {
      return { boost: 15, reason: 'Excellent prior relationship' };
    }

    if (completedMatches.length >= 1 && avgRating >= 4.0) {
      return { boost: 10, reason: 'Good prior experience' };
    }

    if (avgRating <= 2.0) {
      return { boost: -20, reason: 'Poor prior experience' };
    }

    const declinedOrNoShow = history.filter(h => 
      h.outcome === MatchOutcome.DECLINED || h.outcome === MatchOutcome.NO_SHOW
    );

    if (declinedOrNoShow.length >= 2) {
      return { boost: -15, reason: 'Multiple declined/no-shows' };
    }

    return { boost: 5, reason: 'Some prior interaction' };
  }

  /**
   * Get top performing caregivers for a patient
   */
  async getTopCaregivers(
    patientId: string,
    limit: number = 5,
  ): Promise<{ caregiverId: string; score: number; matches: number }[]> {
    const history = await this.historyRepo.find({
      where: { 
        patientId,
        outcome: MatchOutcome.COMPLETED,
      },
    });

    const caregiverScores = new Map<string, { totalRating: number; count: number }>();

    for (const match of history) {
      if (match.patientRating) {
        const existing = caregiverScores.get(match.caregiverId) || { totalRating: 0, count: 0 };
        existing.totalRating += Number(match.patientRating);
        existing.count++;
        caregiverScores.set(match.caregiverId, existing);
      }
    }

    return Array.from(caregiverScores.entries())
      .map(([caregiverId, { totalRating, count }]) => ({
        caregiverId,
        score: totalRating / count,
        matches: count,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate stats from history records
   */
  private calculateStats(history: MatchHistory[]): HistoricalMatchStats {
    const totalMatches = history.length;
    const completedMatches = history.filter(h => h.outcome === MatchOutcome.COMPLETED).length;

    const ratings = history
      .filter(h => h.patientRating)
      .map(h => Number(h.patientRating));

    const durations = history
      .filter(h => h.durationHours)
      .map(h => h.durationHours!);

    const totalIssues = history.reduce((sum, h) => sum + h.issuesReported, 0);

    return {
      totalMatches,
      completedMatches,
      averageRating: ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0,
      averageDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      completionRate: totalMatches > 0 
        ? completedMatches / totalMatches 
        : 0,
      issueRate: totalMatches > 0 
        ? totalIssues / totalMatches 
        : 0,
    };
  }

  /**
   * Generate recommendations for caregiver improvement
   */
  private generateCaregiverRecommendations(
    stats: HistoricalMatchStats,
    repeatClientRate: number,
  ): string[] {
    const recommendations: string[] = [];

    if (stats.completionRate < 0.8) {
      recommendations.push('Consider improving communication to reduce cancellations');
    }

    if (stats.averageRating < 4.0) {
      recommendations.push('Focus on patient satisfaction and feedback');
    }

    if (repeatClientRate < 0.2) {
      recommendations.push('Build stronger relationships with clients for repeat business');
    }

    if (stats.issueRate > 0.1) {
      recommendations.push('Review common issues to prevent recurrence');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent performance - keep up the great work!');
    }

    return recommendations;
  }
}


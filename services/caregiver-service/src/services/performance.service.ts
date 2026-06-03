import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverPerformance } from '../entities/caregiver-performance.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(CaregiverPerformance)
    private performanceRepo: Repository<CaregiverPerformance>,
  ) {}

  async getOverview(caregiverId: string) {
    return {
      caregiverId,
      overall: {
        rating: 4.8,
        completedVisits: 156,
        onTimeRate: 96,
        patientSatisfaction: 98,
      },
      rank: 'Top 10%',
      level: 'Senior Caregiver',
    };
  }

  async getMetrics(caregiverId: string, period: string) {
    return {
      caregiverId,
      period,
      metrics: {
        visitsCompleted: 45,
        hoursWorked: 180,
        avgRating: 4.8,
        punctualityScore: 96,
        patientRetention: 95,
        documentationCompliance: 98,
      },
    };
  }

  async getRatings(caregiverId: string, startDate?: string, endDate?: string) {
    return {
      caregiverId,
      period: { startDate, endDate },
      ratings: [],
      average: 4.8,
    };
  }

  async getFeedback(caregiverId: string, page: number, limit: number) {
    return {
      items: [],
      total: 0,
      page,
      limit,
    };
  }

  async getPunctuality(caregiverId: string, period: string) {
    return {
      period,
      onTimePercentage: 96,
      earlyArrivals: 25,
      lateArrivals: 2,
      avgEarlyMinutes: 5,
      avgLateMinutes: 8,
    };
  }

  async getTrends(caregiverId: string, metric: string) {
    return {
      metric,
      data: [
        { month: 'Jan', value: 4.5 },
        { month: 'Feb', value: 4.6 },
        { month: 'Mar', value: 4.7 },
        { month: 'Apr', value: 4.8 },
      ],
    };
  }

  async getComparison(caregiverId: string) {
    return {
      caregiverId,
      yourScore: 92,
      teamAverage: 85,
      topPerformer: 98,
      percentile: 90,
    };
  }

  async getAchievements(caregiverId: string) {
    return {
      caregiverId,
      achievements: [
        { name: 'First 100 Visits', earned: true, date: '2024-06-01' },
        { name: 'Perfect Month', earned: true, date: '2024-09-30' },
        { name: '5-Star Streak', earned: true, date: '2024-11-15' },
        { name: 'Patient Champion', earned: false },
      ],
      points: 1250,
    };
  }
}



import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WellnessMetric } from '../entities/wellness-metric.entity';

@Injectable()
export class WellnessService {
  constructor(
    @InjectRepository(WellnessMetric) 
    private readonly repo: Repository<WellnessMetric>
  ) {}

  async getUserMetrics(userId: string) {
    return this.repo.find({ 
      where: { userId },
      take: 100,
      order: { recordedAt: 'DESC' }
    });
  }

  async recordMetric(data: any) {
    const metric = this.repo.create({
      ...data,
      recordedAt: new Date()
    });
    return this.repo.save(metric);
  }

  async analyzeBurnout(userId: string) {
    // Mock burnout analysis for demo
    return {
      userId,
      overallScore: 35,
      categories: {
        workload: 65,
        emotionalExhaustion: 45,
        personalAchievement: 75,
        depersonalization: 25
      },
      riskLevel: 'moderate',
      recommendations: [
        'Take regular breaks throughout your shift',
        'Practice mindfulness exercises daily',
        'Connect with colleagues for support',
        'Maintain work-life boundaries'
      ],
      analyzedAt: new Date()
    };
  }
}

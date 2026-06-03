import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NpsScore, NpsCategory } from '../entities/nps-score.entity';

interface RecordNpsDto {
  respondentId: string;
  respondentType: 'patient' | 'caregiver' | 'family';
  targetType: 'platform' | 'agency' | 'service';
  targetId?: string;
  score: number;
  followUpResponse?: string;
  surveyResponseId?: string;
  feedbackRequestId?: string;
  source?: 'survey' | 'standalone' | 'app' | 'email';
}

interface NpsMetrics {
  score: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
}

@Injectable()
export class NpsService {
  private readonly logger = new Logger(NpsService.name);

  constructor(
    @InjectRepository(NpsScore)
    private readonly npsRepo: Repository<NpsScore>,
  ) {}

  async recordNps(dto: RecordNpsDto): Promise<NpsScore> {
    const category = this.categorizeScore(dto.score);

    const nps = this.npsRepo.create({
      ...dto,
      category,
    });

    const saved = await this.npsRepo.save(nps);
    this.logger.log(`NPS score ${dto.score} recorded for ${dto.targetType}`);

    return saved;
  }

  async getNpsMetrics(
    targetType: 'platform' | 'agency' | 'service',
    targetId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<NpsMetrics> {
    const where: any = { targetType };
    if (targetId) where.targetId = targetId;
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const scores = await this.npsRepo.find({ where });

    if (scores.length === 0) {
      return {
        score: 0,
        totalResponses: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        promoterPercentage: 0,
        passivePercentage: 0,
        detractorPercentage: 0,
      };
    }

    const promoters = scores.filter(s => s.category === NpsCategory.PROMOTER).length;
    const passives = scores.filter(s => s.category === NpsCategory.PASSIVE).length;
    const detractors = scores.filter(s => s.category === NpsCategory.DETRACTOR).length;
    const total = scores.length;

    const promoterPercentage = (promoters / total) * 100;
    const passivePercentage = (passives / total) * 100;
    const detractorPercentage = (detractors / total) * 100;

    // NPS = %Promoters - %Detractors
    const npsScore = Math.round(promoterPercentage - detractorPercentage);

    return {
      score: npsScore,
      totalResponses: total,
      promoters,
      passives,
      detractors,
      promoterPercentage: Math.round(promoterPercentage * 100) / 100,
      passivePercentage: Math.round(passivePercentage * 100) / 100,
      detractorPercentage: Math.round(detractorPercentage * 100) / 100,
    };
  }

  async getNpsTrend(
    targetType: 'platform' | 'agency' | 'service',
    targetId?: string,
    months: number = 12,
  ): Promise<{ month: string; score: number; responses: number }[]> {
    const trend: { month: string; score: number; responses: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const metrics = await this.getNpsMetrics(targetType, targetId, startDate, endDate);

      trend.push({
        month: startDate.toISOString().slice(0, 7), // YYYY-MM
        score: metrics.score,
        responses: metrics.totalResponses,
      });
    }

    return trend;
  }

  async getDetractorFollowUps(
    targetType: 'platform' | 'agency' | 'service',
    targetId?: string,
    limit: number = 50,
  ): Promise<NpsScore[]> {
    const where: any = {
      targetType,
      category: NpsCategory.DETRACTOR,
    };
    if (targetId) where.targetId = targetId;

    return this.npsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private categorizeScore(score: number): NpsCategory {
    if (score >= 9) return NpsCategory.PROMOTER;
    if (score >= 7) return NpsCategory.PASSIVE;
    return NpsCategory.DETRACTOR;
  }
}

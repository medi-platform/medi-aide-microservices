import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FeedbackAggregation, AggregationPeriod } from '../entities/feedback-aggregation.entity';
import { Rating } from '../entities/rating.entity';
import { SurveyResponse, ResponseStatus } from '../entities/survey-response.entity';
import { NpsScore, NpsCategory } from '../entities/nps-score.entity';
import { SentimentAnalysis, SentimentScore } from '../entities/sentiment-analysis.entity';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    @InjectRepository(FeedbackAggregation)
    private readonly aggregationRepo: Repository<FeedbackAggregation>,
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    @InjectRepository(NpsScore)
    private readonly npsRepo: Repository<NpsScore>,
    @InjectRepository(SentimentAnalysis)
    private readonly sentimentRepo: Repository<SentimentAnalysis>,
  ) {}

  async getAggregation(
    targetType: 'caregiver' | 'patient' | 'agency' | 'platform',
    targetId: string | null,
    period: AggregationPeriod,
    periodStart: Date,
  ): Promise<FeedbackAggregation | null> {
    return this.aggregationRepo.findOne({
      where: { targetType, targetId: targetId || undefined, period, periodStart },
    });
  }

  async calculateAggregation(
    targetType: 'caregiver' | 'patient' | 'agency' | 'platform',
    targetId: string | null,
    period: AggregationPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<FeedbackAggregation> {
    // Get existing or create new
    let aggregation = await this.getAggregation(targetType, targetId, period, periodStart);

    if (!aggregation) {
      aggregation = this.aggregationRepo.create({
        targetType,
        targetId: targetId || undefined,
        period,
        periodStart,
        periodEnd,
      });
    }

    // Calculate rating metrics
    const ratingWhere: any = { createdAt: Between(periodStart, periodEnd) };
    if (targetType === 'caregiver') ratingWhere.targetType = 'caregiver';
    if (targetId) ratingWhere.targetId = targetId;

    const ratings = await this.ratingRepo.find({ where: ratingWhere });

    aggregation.totalRatings = ratings.length;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      aggregation.averageRating = Math.round((sum / ratings.length) * 100) / 100;

      const distribution: Record<number, number> = {};
      for (const r of ratings) {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      }
      aggregation.ratingDistribution = distribution;
    }

    // Calculate survey metrics
    const surveyWhere: any = {
      status: ResponseStatus.COMPLETED,
      createdAt: Between(periodStart, periodEnd),
    };
    if (targetId && targetType === 'caregiver') surveyWhere.caregiverId = targetId;

    const responses = await this.responseRepo.find({ where: surveyWhere });
    aggregation.totalSurveyResponses = responses.length;

    // Calculate NPS metrics
    const npsWhere: any = { createdAt: Between(periodStart, periodEnd) };
    if (targetType !== 'platform') npsWhere.targetType = targetType;
    if (targetId) npsWhere.targetId = targetId;

    const npsScores = await this.npsRepo.find({ where: npsWhere });
    aggregation.npsResponses = npsScores.length;

    if (npsScores.length > 0) {
      aggregation.promotersCount = npsScores.filter(n => n.category === NpsCategory.PROMOTER).length;
      aggregation.passivesCount = npsScores.filter(n => n.category === NpsCategory.PASSIVE).length;
      aggregation.detractorsCount = npsScores.filter(n => n.category === NpsCategory.DETRACTOR).length;

      const promoterPct = (aggregation.promotersCount / npsScores.length) * 100;
      const detractorPct = (aggregation.detractorsCount / npsScores.length) * 100;
      aggregation.npsScore = Math.round(promoterPct - detractorPct);
    }

    // Calculate sentiment breakdown
    const sentimentScores = await this.sentimentRepo.find({
      where: { analyzedAt: Between(periodStart, periodEnd) },
    });

    if (sentimentScores.length > 0) {
      aggregation.sentimentBreakdown = {
        very_positive: sentimentScores.filter(s => s.sentiment === SentimentScore.VERY_POSITIVE).length,
        positive: sentimentScores.filter(s => s.sentiment === SentimentScore.POSITIVE).length,
        neutral: sentimentScores.filter(s => s.sentiment === SentimentScore.NEUTRAL).length,
        negative: sentimentScores.filter(s => s.sentiment === SentimentScore.NEGATIVE).length,
        very_negative: sentimentScores.filter(s => s.sentiment === SentimentScore.VERY_NEGATIVE).length,
      };
    }

    // Get previous period for change calculation
    const prevPeriodStart = this.getPreviousPeriodStart(periodStart, period);
    const prevAggregation = await this.getAggregation(targetType, targetId, period, prevPeriodStart);

    if (prevAggregation) {
      if (prevAggregation.averageRating && aggregation.averageRating) {
        aggregation.ratingChange = aggregation.averageRating - prevAggregation.averageRating;
      }
      if (prevAggregation.npsScore !== undefined && aggregation.npsScore !== undefined) {
        aggregation.npsChange = aggregation.npsScore - prevAggregation.npsScore;
      }
    }

    aggregation.calculatedAt = new Date();

    return this.aggregationRepo.save(aggregation);
  }

  async runDailyAggregation(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate platform-wide aggregation
    await this.calculateAggregation('platform', null, AggregationPeriod.DAILY, yesterday, endOfDay);

    this.logger.log(`Daily aggregation completed for ${yesterday.toISOString().slice(0, 10)}`);
    return 1;
  }

  async runMonthlyAggregation(): Promise<number> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    await this.calculateAggregation('platform', null, AggregationPeriod.MONTHLY, firstOfMonth, lastOfMonth);

    this.logger.log(`Monthly aggregation completed for ${firstOfMonth.toISOString().slice(0, 7)}`);
    return 1;
  }

  private getPreviousPeriodStart(currentStart: Date, period: AggregationPeriod): Date {
    const prev = new Date(currentStart);

    switch (period) {
      case AggregationPeriod.DAILY:
        prev.setDate(prev.getDate() - 1);
        break;
      case AggregationPeriod.WEEKLY:
        prev.setDate(prev.getDate() - 7);
        break;
      case AggregationPeriod.MONTHLY:
        prev.setMonth(prev.getMonth() - 1);
        break;
      case AggregationPeriod.QUARTERLY:
        prev.setMonth(prev.getMonth() - 3);
        break;
      case AggregationPeriod.YEARLY:
        prev.setFullYear(prev.getFullYear() - 1);
        break;
    }

    return prev;
  }
}

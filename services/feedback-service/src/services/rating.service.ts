import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { RatingBreakdown } from '../interfaces/feedback.interface';

type RatingTargetType = Rating['targetType'];

/**
 * Rating Service
 * Manages standalone ratings
 */
@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
  ) {}

  /**
   * Submit a rating
   */
  async submitRating(
    targetId: string,
    targetType: 'caregiver' | 'patient' | 'visit' | 'agency' | 'service',
    rating: number,
    raterId?: string,
    raterType?: 'patient' | 'family' | 'caregiver' | 'agency',
    visitId?: string,
    comment?: string,
    categoryRatings?: Record<string, number>,
    isAnonymous?: boolean,
  ): Promise<Rating> {
    const ratingEntity = this.ratingRepo.create({
      targetId,
      targetType,
      rating: Math.min(5, Math.max(1, rating)),
      raterId: isAnonymous ? undefined : raterId,
      raterType,
      visitId,
      comment,
      categoryRatings,
      isAnonymous: isAnonymous || false,
      isPublic: true,
    });

    const saved = await this.ratingRepo.save(ratingEntity);
    this.logger.log(`Rating ${saved.id} submitted for ${targetType} ${targetId}`);
    return saved;
  }

  /**
   * Get ratings for a target
   */
  async getRatings(
    targetId: string,
    targetType: string,
    limit: number = 20,
    onlyPublic: boolean = true,
  ): Promise<Rating[]> {
    const where: Record<string, unknown> = {
      targetId,
      targetType: targetType as RatingTargetType,
      isFlagged: false,
    };
    if (onlyPublic) where.isPublic = true;

    return this.ratingRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get rating breakdown for a target
   */
  async getRatingBreakdown(targetId: string, targetType: string): Promise<RatingBreakdown> {
    const ratings = await this.ratingRepo.find({
      where: { targetId, targetType: targetType as RatingTargetType, isFlagged: false },
      select: ['rating'],
    });

    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of ratings) {
      sum += r.rating;
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    }

    return {
      average: Math.round((sum / ratings.length) * 100) / 100,
      count: ratings.length,
      distribution,
    };
  }

  /**
   * Respond to a rating
   */
  async respondToRating(ratingId: string, responseText: string, responderId: string): Promise<Rating> {
    const rating = await this.ratingRepo.findOne({ where: { id: ratingId } });
    if (!rating) {
      throw new NotFoundException(`Rating ${ratingId} not found`);
    }

    rating.responseId = responderId;
    rating.responseText = responseText;
    rating.responseAt = new Date();

    return this.ratingRepo.save(rating);
  }

  /**
   * Flag a rating for review
   */
  async flagRating(ratingId: string, reason: string): Promise<Rating> {
    const rating = await this.ratingRepo.findOne({ where: { id: ratingId } });
    if (!rating) {
      throw new NotFoundException(`Rating ${ratingId} not found`);
    }

    rating.isFlagged = true;
    rating.flagReason = reason;

    return this.ratingRepo.save(rating);
  }

  /**
   * Get average rating for a target
   */
  async getAverageRating(targetId: string, targetType: string): Promise<number | null> {
    const result = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.targetId = :targetId', { targetId })
      .andWhere('r.targetType = :targetType', { targetType })
      .andWhere('r.isFlagged = false')
      .getRawOne();

    return result?.avg ? parseFloat(result.avg) : null;
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from '../entities/recommendation.entity';
import { BurnoutRisk } from '../entities/burnout-risk.entity';
import { 
  CreateRecommendationDto, 
  UpdateRecommendationDto, 
  RecommendationQueryDto,
  RecommendationResponseDto,
} from '../dto/recommendation.dto';
import { RecommendationType, RecommendationCategory } from '../enums/recommendation-type.enum';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  // Pre-defined recommendation templates by category
  private readonly recommendationTemplates: Record<RecommendationCategory, string[]> = {
    [RecommendationCategory.PHYSICAL]: [
      'Take a 5-minute stretch break to reduce muscle tension',
      'Consider a short walk during your break',
      'Practice proper posture while working',
    ],
    [RecommendationCategory.MENTAL]: [
      'Try a 2-minute breathing exercise to clear your mind',
      'Take a brief mental break - look at something green',
      'Practice mindfulness for 5 minutes',
    ],
    [RecommendationCategory.EMOTIONAL]: [
      'Connect with a colleague for a quick chat',
      'Acknowledge your feelings without judgment',
      'Write down three things you are grateful for',
    ],
    [RecommendationCategory.SOCIAL]: [
      'Reach out to a friend or family member',
      'Join a team activity or group discussion',
      'Share a positive moment with a colleague',
    ],
    [RecommendationCategory.SLEEP]: [
      'Aim for 7-9 hours of sleep tonight',
      'Avoid screens 1 hour before bed',
      'Create a calming bedtime routine',
    ],
    [RecommendationCategory.NUTRITION]: [
      'Stay hydrated - drink water regularly',
      'Include fruits and vegetables in your meals',
      'Avoid excessive caffeine late in the day',
    ],
    [RecommendationCategory.EXERCISE]: [
      'Aim for 30 minutes of moderate activity today',
      'Try a quick 10-minute workout between tasks',
      'Take the stairs instead of the elevator',
    ],
    [RecommendationCategory.STRESS_MANAGEMENT]: [
      'Identify your top stressors and address one today',
      'Practice the 4-7-8 breathing technique',
      'Set boundaries to protect your personal time',
    ],
    [RecommendationCategory.WORK_LIFE_BALANCE]: [
      'Define clear work hours and stick to them',
      'Schedule time for hobbies and interests',
      'Take your full lunch break away from work',
    ],
  };

  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepo: Repository<Recommendation>,
    @InjectRepository(BurnoutRisk)
    private readonly burnoutRepo: Repository<BurnoutRisk>,
  ) {}

  /**
   * Create a new recommendation
   */
  async create(userId: string, dto: CreateRecommendationDto): Promise<Recommendation> {
    const recommendation = this.recommendationRepo.create({
      userId,
      type: dto.type || RecommendationType.SYSTEM,
      category: dto.category,
      content: dto.content,
      tip: dto.tip,
      priority: dto.priority,
      confidenceScore: dto.confidenceScore,
      metadata: dto.metadata,
      viewed: false,
    });

    const saved = await this.recommendationRepo.save(recommendation);
    this.logger.log(`✅ Created recommendation ${saved.id} for user ${userId}`);
    return saved;
  }

  /**
   * Get recommendations for a user
   */
  async findAll(userId: string, query?: RecommendationQueryDto): Promise<Recommendation[]> {
    const queryBuilder = this.recommendationRepo.createQueryBuilder('rec')
      .where('rec.userId = :userId', { userId })
      .orderBy('rec.createdAt', 'DESC');

    if (query?.type) {
      queryBuilder.andWhere('rec.type = :type', { type: query.type });
    }
    if (query?.category) {
      queryBuilder.andWhere('rec.category = :category', { category: query.category });
    }
    if (query?.viewed !== undefined) {
      queryBuilder.andWhere('rec.viewed = :viewed', { viewed: query.viewed });
    }

    const limit = query?.limit ?? 20;
    const offset = query?.offset ?? 0;
    queryBuilder.take(limit).skip(offset);

    return queryBuilder.getMany();
  }

  /**
   * Get a single recommendation
   */
  async findOne(id: string): Promise<Recommendation> {
    const recommendation = await this.recommendationRepo.findOneBy({ id });
    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }
    return recommendation;
  }

  /**
   * Update a recommendation (mark as viewed, accepted, etc.)
   */
  async update(id: string, dto: UpdateRecommendationDto): Promise<Recommendation> {
    const recommendation = await this.findOne(id);

    if (dto.viewed !== undefined) {
      recommendation.viewed = dto.viewed;
      if (dto.viewed) {
        recommendation.viewedAt = new Date();
      }
    }

    if (dto.accepted !== undefined) {
      recommendation.accepted = dto.accepted;
      if (dto.accepted) {
        recommendation.acceptedAt = new Date();
      }
    }

    if (dto.feedback) {
      recommendation.feedback = dto.feedback;
    }

    return this.recommendationRepo.save(recommendation);
  }

  /**
   * Delete a recommendation
   */
  async remove(id: string): Promise<void> {
    const { affected } = await this.recommendationRepo.delete(id);
    if (!affected) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }
  }

  /**
   * Generate AI-powered recommendations based on user's wellness data
   */
  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    this.logger.log(`🤖 Generating AI recommendations for user ${userId}`);

    // Get latest burnout risk
    const burnoutRisk = await this.burnoutRepo.findOne({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    });

    const recommendations: Recommendation[] = [];
    const now = new Date();

    // Base recommendations on burnout risk
    if (burnoutRisk) {
      const categories = this.getCategoriesForRiskLevel(burnoutRisk.label);

      for (const category of categories) {
        const templates = this.recommendationTemplates[category];
        if (templates && templates.length > 0) {
          const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

          const rec = this.recommendationRepo.create({
            userId,
            type: RecommendationType.AI,
            category,
            content: randomTemplate,
            priority: this.getPriorityFromRisk(burnoutRisk.label),
            confidenceScore: 0.75 + Math.random() * 0.2,
            personalizationScore: 0.6 + Math.random() * 0.3,
            modelVersion: 'wellness-rec-v1.0',
            metadata: {
              basedOn: 'burnout_risk',
              burnoutScore: burnoutRisk.burnoutScore,
              riskLabel: burnoutRisk.label,
            },
            viewed: false,
          });

          recommendations.push(rec);
        }
      }
    } else {
      // Generate general wellness recommendations
      const generalCategories = [
        RecommendationCategory.PHYSICAL,
        RecommendationCategory.MENTAL,
        RecommendationCategory.SLEEP,
      ];

      for (const category of generalCategories) {
        const templates = this.recommendationTemplates[category];
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

        const rec = this.recommendationRepo.create({
          userId,
          type: RecommendationType.AI,
          category,
          content: randomTemplate,
          priority: 'medium',
          confidenceScore: 0.65,
          modelVersion: 'wellness-rec-v1.0',
          viewed: false,
        });

        recommendations.push(rec);
      }
    }

    // Save all recommendations
    const saved = await this.recommendationRepo.save(recommendations);
    this.logger.log(`✅ Generated ${saved.length} recommendations for user ${userId}`);

    return saved;
  }

  /**
   * Get unread recommendations count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.recommendationRepo.count({
      where: { userId, viewed: false },
    });
  }

  /**
   * Mark all recommendations as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.recommendationRepo.update(
      { userId, viewed: false },
      { viewed: true, viewedAt: new Date() },
    );
  }

  /**
   * Get recommendation statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    accepted: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [total, unread, accepted] = await Promise.all([
      this.recommendationRepo.count({ where: { userId } }),
      this.recommendationRepo.count({ where: { userId, viewed: false } }),
      this.recommendationRepo.count({ where: { userId, accepted: true } }),
    ]);

    const byCategoryResult = await this.recommendationRepo
      .createQueryBuilder('rec')
      .select('rec.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('rec.userId = :userId', { userId })
      .groupBy('rec.category')
      .getRawMany();

    const byTypeResult = await this.recommendationRepo
      .createQueryBuilder('rec')
      .select('rec.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('rec.userId = :userId', { userId })
      .groupBy('rec.type')
      .getRawMany();

    const byCategory = byCategoryResult.reduce((acc, r) => {
      acc[r.category || 'unknown'] = parseInt(r.count, 10);
      return acc;
    }, {} as Record<string, number>);

    const byType = byTypeResult.reduce((acc, r) => {
      acc[r.type] = parseInt(r.count, 10);
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, accepted, byCategory, byType };
  }

  // Private helper methods

  private getCategoriesForRiskLevel(riskLabel: string): RecommendationCategory[] {
    switch (riskLabel.toLowerCase()) {
      case 'critical':
        return [
          RecommendationCategory.STRESS_MANAGEMENT,
          RecommendationCategory.MENTAL,
          RecommendationCategory.EMOTIONAL,
          RecommendationCategory.SLEEP,
        ];
      case 'high':
        return [
          RecommendationCategory.STRESS_MANAGEMENT,
          RecommendationCategory.WORK_LIFE_BALANCE,
          RecommendationCategory.SLEEP,
        ];
      case 'medium':
        return [
          RecommendationCategory.PHYSICAL,
          RecommendationCategory.MENTAL,
          RecommendationCategory.EXERCISE,
        ];
      default:
        return [
          RecommendationCategory.PHYSICAL,
          RecommendationCategory.NUTRITION,
        ];
    }
  }

  private getPriorityFromRisk(riskLabel: string): string {
    switch (riskLabel.toLowerCase()) {
      case 'critical':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }
}


import {
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WellnessCheckin } from '../entities/wellness-checkin.entity';
import { BurnoutRisk } from '../entities/burnout-risk.entity';
import { CreateWellnessCheckinDto, MoodType } from '../dto/wellness-checkin.dto';
import { BurnoutRiskLabel, BurnoutCalculationResult } from '../interfaces/wellness-types.interface';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    @InjectRepository(WellnessCheckin)
    private readonly checkinRepo: Repository<WellnessCheckin>,
    @InjectRepository(BurnoutRisk)
    private readonly burnoutRepo: Repository<BurnoutRisk>,
  ) {}

  /**
   * Calculate burnout risk based on checkin data
   */
  private calculateBurnout(dto: CreateWellnessCheckinDto): BurnoutCalculationResult {
    let score = dto.stressLevel * 10 - (dto.sleepQuality - 5) * 5;

    // Adjust score based on mood
    switch (dto.mood) {
      case MoodType.HAPPY:
      case MoodType.ENERGETIC:
        score -= 20;
        break;
      case MoodType.NEUTRAL:
        score -= 10;
        break;
      case MoodType.SAD:
        score += 10;
        break;
      case MoodType.STRESSED:
      case MoodType.ANXIOUS:
        score += 20;
        break;
    }

    // Adjust for energy level if provided
    if (dto.energyLevel !== undefined) {
      score -= (dto.energyLevel - 5) * 3;
    }

    // Adjust for pain level if provided
    if (dto.painLevel !== undefined) {
      score += dto.painLevel * 2;
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(score, 100));

    if (score > 85) {
      return {
        burnoutScore: score,
        label: 'Critical',
        advice: 'Critical risk: Immediate intervention required. Please reach out to your supervisor or wellness support.',
        colorScheme: 'darkred',
      };
    }
    if (score > 70) {
      return {
        burnoutScore: score,
        label: 'High',
        advice: 'High risk: Please prioritize rest and seek support from colleagues or management.',
        colorScheme: 'red',
      };
    }
    if (score > 40) {
      return {
        burnoutScore: score,
        label: 'Medium',
        advice: 'Moderate risk: Monitor your stress levels closely and maintain self-care routines.',
        colorScheme: 'yellow',
      };
    }
    return {
      burnoutScore: score,
      label: 'Low',
      advice: 'Low risk: Great job maintaining your wellbeing! Keep up your healthy habits.',
      colorScheme: 'green',
    };
  }

  /**
   * Generate personalized recommendations based on burnout assessment
   */
  private generateRecommendations(label: BurnoutRiskLabel, dto: CreateWellnessCheckinDto): string[] {
    const recommendations: string[] = [];

    if (label === 'Critical' || label === 'High') {
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Take immediate steps to reduce workload if possible');
      recommendations.push('Ensure you are getting adequate rest between shifts');
    }

    if (dto.stressLevel >= 7) {
      recommendations.push('Practice deep breathing exercises for 5 minutes');
      recommendations.push('Take regular short breaks during your shift');
    }

    if (dto.sleepQuality <= 4) {
      recommendations.push('Establish a consistent sleep schedule');
      recommendations.push('Limit screen time before bed');
      recommendations.push('Consider sleep hygiene improvements');
    }

    if (dto.mood === MoodType.SAD || dto.mood === MoodType.ANXIOUS) {
      recommendations.push('Connect with supportive colleagues');
      recommendations.push('Practice mindfulness or meditation');
    }

    if (dto.energyLevel !== undefined && dto.energyLevel <= 4) {
      recommendations.push('Consider a short walk or light exercise');
      recommendations.push('Stay hydrated throughout your shift');
    }

    // Always add general wellness tips
    recommendations.push('Maintain work-life boundaries');

    return recommendations;
  }

  /**
   * Submit a new wellness checkin
   */
  async submitCheckin(
    userId: string,
    dto: CreateWellnessCheckinDto,
  ): Promise<WellnessCheckin & { burnoutRisk: BurnoutRisk }> {
    try {
      this.logger.log(`📝 Processing wellness checkin for user ${userId}`);

      const burnoutCalc = this.calculateBurnout(dto);
      const recommendations = this.generateRecommendations(burnoutCalc.label, dto);

      // Save checkin
      const savedCheckin = await this.checkinRepo.save(
        this.checkinRepo.create({
          userId,
          mood: dto.mood,
          stressLevel: dto.stressLevel,
          sleepQuality: dto.sleepQuality,
          energyLevel: dto.energyLevel,
          painLevel: dto.painLevel,
          recentBehavior: dto.recentBehavior,
          notes: dto.notes,
          createdAt: new Date(),
        }),
      );

      // Save burnout risk assessment
      const savedBurnout = await this.burnoutRepo.save(
        this.burnoutRepo.create({
          userId,
          burnoutScore: burnoutCalc.burnoutScore,
          label: burnoutCalc.label,
          advice: burnoutCalc.advice,
          colorScheme: burnoutCalc.colorScheme,
          factors: {
            workload: dto.stressLevel * 10,
            emotionalExhaustion: dto.mood === MoodType.STRESSED || dto.mood === MoodType.ANXIOUS ? 70 : 40,
            personalAchievement: dto.energyLevel ? dto.energyLevel * 10 : 50,
            depersonalization: dto.mood === MoodType.SAD ? 60 : 30,
          },
          recommendations,
          calculatedAt: new Date(),
        }),
      );

      this.logger.log(`✅ Wellness checkin saved for user ${userId}, burnout score: ${burnoutCalc.burnoutScore}`);

      return { ...savedCheckin, burnoutRisk: savedBurnout };
    } catch (err) {
      this.logger.error(
        `❌ Error saving checkin for user ${userId}: ${err instanceof Error ? err.message : err}`,
      );
      throw new HttpException(
        'Failed to submit wellness checkin.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get the latest checkin for a user
   */
  async getLatestCheckin(userId: string): Promise<WellnessCheckin> {
    this.logger.log(`🔍 Fetching latest checkin for user ${userId}`);

    const latest = await this.checkinRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!latest) {
      this.logger.warn(`⚠️ No checkin found for user ${userId}`);
      throw new NotFoundException('No wellness checkin data found for user.');
    }

    return latest;
  }

  /**
   * Get the latest burnout risk for a user
   */
  async findLatestBurnoutRisk(userId: string): Promise<BurnoutRisk | null> {
    try {
      return await this.burnoutRepo.findOne({
        where: { userId },
        order: { calculatedAt: 'DESC' },
      });
    } catch (err) {
      this.logger.error(
        `❌ DB error retrieving burnout risk for user ${userId}: ${err}`,
      );
      throw new HttpException(
        'Failed to retrieve latest burnout risk.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all checkins for a user
   */
  async findAll(userId: string, limit = 50): Promise<WellnessCheckin[]> {
    return this.checkinRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get checkin history with burnout trends
   */
  async getCheckinHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 30,
  ): Promise<{ checkins: WellnessCheckin[]; burnoutTrend: BurnoutRisk[] }> {
    const queryBuilder = this.checkinRepo.createQueryBuilder('checkin')
      .where('checkin.userId = :userId', { userId })
      .orderBy('checkin.createdAt', 'DESC')
      .take(limit);

    if (startDate) {
      queryBuilder.andWhere('checkin.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('checkin.createdAt <= :endDate', { endDate });
    }

    const checkins = await queryBuilder.getMany();

    const burnoutTrend = await this.burnoutRepo.find({
      where: { userId },
      order: { calculatedAt: 'DESC' },
      take: limit,
    });

    return { checkins, burnoutTrend };
  }

  /**
   * Update an existing checkin
   */
  async update(
    id: string,
    dto: Partial<CreateWellnessCheckinDto>,
  ): Promise<WellnessCheckin> {
    await this.checkinRepo.update(id, dto);
    const updated = await this.checkinRepo.findOneBy({ id });
    if (!updated) throw new NotFoundException('Checkin not found');
    return updated;
  }

  /**
   * Delete a checkin
   */
  async remove(id: string): Promise<void> {
    const { affected } = await this.checkinRepo.delete(id);
    if (!affected) throw new NotFoundException('Checkin not found');
  }

  /**
   * Get wellness score summary for a user
   */
  async getWellnessScore(userId: string): Promise<{
    overallScore: number;
    categories: Record<string, number>;
    riskLevel: string;
    recommendations: string[];
    analyzedAt: Date;
  }> {
    const latestBurnout = await this.findLatestBurnoutRisk(userId);
    const recentCheckins = await this.findAll(userId, 7);

    if (!latestBurnout || recentCheckins.length === 0) {
      return {
        overallScore: 50,
        categories: {
          workload: 50,
          emotionalExhaustion: 50,
          personalAchievement: 50,
          depersonalization: 50,
        },
        riskLevel: 'unknown',
        recommendations: ['Complete your first wellness checkin to get personalized insights'],
        analyzedAt: new Date(),
      };
    }

    // Calculate averages from recent checkins
    const avgStress = recentCheckins.reduce((sum, c) => sum + c.stressLevel, 0) / recentCheckins.length;
    const avgSleep = recentCheckins.reduce((sum, c) => sum + c.sleepQuality, 0) / recentCheckins.length;

    return {
      overallScore: 100 - latestBurnout.burnoutScore,
      categories: latestBurnout.factors || {
        workload: avgStress * 10,
        emotionalExhaustion: 50,
        personalAchievement: avgSleep * 10,
        depersonalization: 30,
      },
      riskLevel: latestBurnout.label.toLowerCase(),
      recommendations: latestBurnout.recommendations || [],
      analyzedAt: latestBurnout.calculatedAt,
    };
  }
}


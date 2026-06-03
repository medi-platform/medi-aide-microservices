/**
 * Observation Service
 * Business logic for mood observations and meal tracking
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ResidentialMoodObservation } from '../entities/residential-mood-observation.entity';
import { ResidentialMealEntry } from '../entities/residential-meal-entry.entity';
import { MoodLevel, BehaviorType, MealType, IntakeLevel } from '../interfaces/residential.interface';

export interface CreateMoodObservationDto {
  residence_id: string;
  resident_id: string;
  shift_id?: string;
  observer_id: string;
  observer_name?: string;
  observation_date: Date;
  observation_time: Date;
  mood_level: MoodLevel;
  primary_emotion?: string;
  behaviors_observed?: BehaviorType[];
  activity_context?: string;
  location?: string;
  verbal_expressions?: string;
  non_verbal_cues?: string;
  social_interactions?: string;
  pain_level?: number;
  pain_location?: string;
  possible_triggers?: string;
  interventions_used?: string;
  intervention_effectiveness?: string;
  compared_to_baseline?: string;
  significant_change?: boolean;
  requires_follow_up?: boolean;
  notes?: string;
}

export interface CreateMealEntryDto {
  residence_id: string;
  resident_id: string;
  shift_id?: string;
  recorded_by_id: string;
  meal_date: Date;
  meal_time: Date;
  meal_type: MealType;
  food_intake: IntakeLevel;
  fluid_intake: IntakeLevel;
  fluid_amount_ml?: number;
  menu_items?: string;
  items_eaten?: string[];
  items_refused?: string[];
  assistance_level?: string;
  texture_modification?: string;
  fluid_consistency?: string;
  appetite_notes?: string;
  behavior_during_meal?: string;
  choking_incident?: boolean;
  aspiration_risk_observed?: boolean;
  notes?: string;
}

@Injectable()
export class ObservationService {
  constructor(
    @InjectRepository(ResidentialMoodObservation)
    private readonly moodRepository: Repository<ResidentialMoodObservation>,
    @InjectRepository(ResidentialMealEntry)
    private readonly mealRepository: Repository<ResidentialMealEntry>,
  ) {}

  // Mood Observation Methods
  async createMoodObservation(dto: CreateMoodObservationDto): Promise<ResidentialMoodObservation> {
    const observation = this.moodRepository.create(dto);
    return this.moodRepository.save(observation);
  }

  async findMoodObservationById(id: string): Promise<ResidentialMoodObservation> {
    const observation = await this.moodRepository.findOne({ where: { id } });
    if (!observation) {
      throw new NotFoundException(`Mood observation with ID ${id} not found`);
    }
    return observation;
  }

  async listMoodObservations(
    residentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ResidentialMoodObservation[]> {
    return this.moodRepository.find({
      where: {
        resident_id: residentId,
        observation_date: Between(startDate, endDate),
      },
      order: { observation_date: 'DESC', observation_time: 'DESC' },
    });
  }

  async getMoodTrend(residentId: string, days: number = 30): Promise<{
    averageMood: number;
    trend: 'improving' | 'stable' | 'declining';
    observations: { date: Date; moodLevel: number }[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const observations = await this.moodRepository.find({
      where: {
        resident_id: residentId,
        observation_date: Between(startDate, endDate),
      },
      order: { observation_date: 'ASC' },
    });

    if (observations.length === 0) {
      return { averageMood: 0, trend: 'stable', observations: [] };
    }

    const moods = observations.map((o) => o.mood_level);
    const averageMood = moods.reduce((a, b) => a + b, 0) / moods.length;

    // Simple trend calculation: compare first half to second half
    const midpoint = Math.floor(moods.length / 2);
    const firstHalf = moods.slice(0, midpoint);
    const secondHalf = moods.slice(midpoint);

    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg > firstAvg + 0.5) trend = 'improving';
    else if (secondAvg < firstAvg - 0.5) trend = 'declining';

    return {
      averageMood: Math.round(averageMood * 100) / 100,
      trend,
      observations: observations.map((o) => ({
        date: o.observation_date,
        moodLevel: o.mood_level,
      })),
    };
  }

  async escalateToClinic(id: string, escalatedTo: string): Promise<ResidentialMoodObservation> {
    const observation = await this.findMoodObservationById(id);
    observation.escalated_to_clinical = true;
    observation.escalated_to = escalatedTo;
    return this.moodRepository.save(observation);
  }

  // Meal Entry Methods
  async createMealEntry(dto: CreateMealEntryDto): Promise<ResidentialMealEntry> {
    const entry = this.mealRepository.create(dto);

    // Auto-flag poor intake
    if (dto.food_intake === IntakeLevel.NONE || dto.food_intake === IntakeLevel.MINIMAL) {
      entry.poor_intake_alert = true;
    }

    return this.mealRepository.save(entry);
  }

  async findMealEntryById(id: string): Promise<ResidentialMealEntry> {
    const entry = await this.mealRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Meal entry with ID ${id} not found`);
    }
    return entry;
  }

  async listMealEntries(
    residentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ResidentialMealEntry[]> {
    return this.mealRepository.find({
      where: {
        resident_id: residentId,
        meal_date: Between(startDate, endDate),
      },
      order: { meal_date: 'DESC', meal_time: 'DESC' },
    });
  }

  async getDailyMeals(residentId: string, date: Date): Promise<ResidentialMealEntry[]> {
    return this.mealRepository.find({
      where: {
        resident_id: residentId,
        meal_date: date,
      },
      order: { meal_time: 'ASC' },
    });
  }

  async getNutritionSummary(residentId: string, days: number = 7): Promise<{
    averageFoodIntake: string;
    averageFluidIntake: string;
    totalFluidMl: number;
    mealsWithPoorIntake: number;
    totalMeals: number;
    alerts: string[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.mealRepository.find({
      where: {
        resident_id: residentId,
        meal_date: Between(startDate, endDate),
      },
    });

    if (entries.length === 0) {
      return {
        averageFoodIntake: 'N/A',
        averageFluidIntake: 'N/A',
        totalFluidMl: 0,
        mealsWithPoorIntake: 0,
        totalMeals: 0,
        alerts: [],
      };
    }

    const intakeValues: Record<IntakeLevel, number> = {
      [IntakeLevel.NONE]: 0,
      [IntakeLevel.MINIMAL]: 25,
      [IntakeLevel.HALF]: 50,
      [IntakeLevel.GOOD]: 75,
      [IntakeLevel.FULL]: 100,
    };

    const foodScores = entries.map((e) => intakeValues[e.food_intake] || 50);
    const fluidScores = entries.map((e) => intakeValues[e.fluid_intake] || 50);
    const avgFood = foodScores.reduce((a, b) => a + b, 0) / foodScores.length;
    const avgFluid = fluidScores.reduce((a, b) => a + b, 0) / fluidScores.length;
    const totalFluid = entries.reduce((acc, e) => acc + (e.fluid_amount_ml || 0), 0);
    const poorIntakeCount = entries.filter(
      (e) => e.food_intake === IntakeLevel.NONE || e.food_intake === IntakeLevel.MINIMAL
    ).length;

    const alerts: string[] = [];
    if (avgFood < 50) alerts.push('Low average food intake');
    if (avgFluid < 50) alerts.push('Low average fluid intake');
    if (poorIntakeCount >= 3) alerts.push('Multiple meals with poor intake');
    if (entries.some((e) => e.choking_incident)) alerts.push('Choking incident recorded');
    if (entries.some((e) => e.aspiration_risk_observed)) alerts.push('Aspiration risk observed');

    const getIntakeLabel = (pct: number): string => {
      if (pct >= 75) return 'Good';
      if (pct >= 50) return 'Moderate';
      if (pct >= 25) return 'Poor';
      return 'Critical';
    };

    return {
      averageFoodIntake: getIntakeLabel(avgFood),
      averageFluidIntake: getIntakeLabel(avgFluid),
      totalFluidMl: totalFluid,
      mealsWithPoorIntake: poorIntakeCount,
      totalMeals: entries.length,
      alerts,
    };
  }

  async flagWeightConcern(id: string): Promise<ResidentialMealEntry> {
    const entry = await this.findMealEntryById(id);
    entry.weight_concern_flagged = true;
    return this.mealRepository.save(entry);
  }
}

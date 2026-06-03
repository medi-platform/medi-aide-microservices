import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CaregiverCandidate, CareRequest, FeatureVector } from '../interfaces/matching.interfaces';

/**
 * Feature Store Service
 * 
 * Uber-grade feature engineering and storage for ML models.
 * Provides real-time feature computation and caching.
 */
@Injectable()
export class FeatureStoreService implements OnModuleInit {
  private readonly logger = new Logger(FeatureStoreService.name);
  private redis: Redis | null = null;
  
  private readonly FEATURE_VERSION = process.env.FEATURE_VERSION || 'v2.0.0';
  private readonly CACHE_TTL = parseInt(process.env.FEATURE_CACHE_TTL || '300', 10);
  private readonly CACHE_ENABLED = process.env.FEATURE_CACHE_ENABLED === 'true';
  
  async onModuleInit(): Promise<void> {
    if (!this.CACHE_ENABLED) {
      this.logger.log('Feature Store cache disabled');
      return;
    }
    
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.redis = new Redis(redisUrl, { lazyConnect: true });
      await this.redis.connect();
      this.logger.log('Feature Store connected to Redis');
    } catch (error) {
      this.logger.warn(`Redis connection failed, caching disabled: ${error}`);
      this.redis = null;
    }
  }
  
  /**
   * Get caregiver features with caching
   */
  async getCaregiverFeatures(caregiverId: string): Promise<CaregiverFeatures | null> {
    const cacheKey = `features:caregiver:${this.FEATURE_VERSION}:${caregiverId}`;
    
    // Try cache first
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.warn(`Cache read failed: ${error}`);
      }
    }
    
    return null;
  }
  
  /**
   * Compute and cache caregiver features
   */
  async computeCaregiverFeatures(candidate: CaregiverCandidate): Promise<CaregiverFeatures> {
    const features: CaregiverFeatures = {
      // Static features
      experienceYears: candidate.experienceYears,
      skillCount: candidate.skills.length,
      certificationCount: candidate.certifications.length,
      languageCount: candidate.languages.length,
      hasLiveInCapability: candidate.availability.liveIn,
      hasOvernightCapability: candidate.availability.overnight,
      hasWeekendAvailability: this.hasWeekendAvailability(candidate),
      
      // Performance features
      avgRating: candidate.metrics.rating,
      ratingCount: candidate.metrics.completedCareRequests,
      completedRequestsTotal: candidate.metrics.completedCareRequests,
      completedRequestsLast30Days: Math.round(candidate.metrics.completedCareRequests * 0.1),
      completedRequestsLast90Days: Math.round(candidate.metrics.completedCareRequests * 0.3),
      acceptanceRate: candidate.metrics.acceptanceRate,
      cancellationRate: candidate.metrics.cancellationRate,
      avgResponseTimeMinutes: candidate.metrics.responseTimeMinutes,
      
      // Engagement features
      profileCompleteness: this.calculateProfileCompleteness(candidate),
      lastActiveHoursAgo: 24, // Default
      daysOnPlatform: candidate.experienceYears * 365,
      
      // Geographic features
      latitude: candidate.location.latitude,
      longitude: candidate.location.longitude,
      serviceRadiusKm: candidate.preferences.maxDistanceKm,
      
      // Rate features
      hourlyRateMin: candidate.preferences?.hourlyRateMin ?? 0,
      hourlyRateMax: candidate.preferences?.hourlyRateMax ?? 0,
      avgHourlyRate: ((candidate.preferences?.hourlyRateMin ?? 0) + (candidate.preferences?.hourlyRateMax ?? 0)) / 2,
      
      // Derived features
      reliabilityScore: this.calculateReliabilityScore(candidate),
      experienceWeightedRating: candidate.metrics.rating * (1 + Math.log10(candidate.experienceYears + 1)),
      activityScore: this.calculateActivityScore(candidate),
      qualityScore: this.calculateQualityScore(candidate),
    };
    
    // Cache features
    if (this.redis) {
      const cacheKey = `features:caregiver:${this.FEATURE_VERSION}:${candidate.id}`;
      try {
        await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(features));
      } catch (error) {
        this.logger.warn(`Cache write failed: ${error}`);
      }
    }
    
    return features;
  }
  
  /**
   * Compute care request features
   */
  async computeCareRequestFeatures(careRequest: CareRequest): Promise<CareRequestFeatures> {
    return {
      requiredSkillCount: careRequest.requiredSkills?.length || 0,
      requiredExperience: careRequest.requiredExperience || 0,
      budgetMin: careRequest.budgetMin || 0,
      budgetMax: careRequest.budgetMax || 0,
      estimatedHoursPerWeek: careRequest.estimatedHoursPerWeek || 0,
      urgencyLevel: this.mapUrgencyToNumber(careRequest.urgency),
      hasLocationPreference: !!careRequest.location?.latitude,
      hasLanguagePreference: (careRequest.preferredLanguages?.length || 0) > 0,
      hasScheduleConstraints: !!careRequest.schedule?.timeSlots?.length,
    };
  }
  
  /**
   * Compute match features (cross-entity features)
   */
  async computeMatchFeatures(
    caregiverFeatures: CaregiverFeatures,
    requestFeatures: CareRequestFeatures,
    candidate: CaregiverCandidate,
    careRequest: CareRequest
  ): Promise<MatchFeatures> {
    const skillMatchCount = careRequest.requiredSkills?.filter(skill =>
      candidate.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    ).length || 0;
    
    const distanceKm = candidate.calculatedDistanceKm || 0;
    
    return {
      // Skill matching
      skillMatchRatio: requestFeatures.requiredSkillCount > 0
        ? skillMatchCount / requestFeatures.requiredSkillCount
        : 1,
      skillMatchCount,
      missingSkillCount: (requestFeatures.requiredSkillCount || 0) - skillMatchCount,
      
      // Location matching
      distanceKm,
      isWithinPreferredRadius: distanceKm <= caregiverFeatures.serviceRadiusKm,
      travelTimeMinutes: Math.round(distanceKm * 2), // Rough estimate
      
      // Budget matching
      budgetCompatibility: this.calculateBudgetCompatibility(
        requestFeatures.budgetMin,
        requestFeatures.budgetMax,
        caregiverFeatures.hourlyRateMin,
        caregiverFeatures.hourlyRateMax
      ),
      isWithinBudget: caregiverFeatures.hourlyRateMin <= (requestFeatures.budgetMax || Infinity),
      priceDifferencePercent: this.calculatePriceDifference(
        requestFeatures.budgetMax,
        caregiverFeatures.hourlyRateMin
      ),
      
      // Availability matching
      availabilityOverlap: 0.7, // Default, would need schedule data
      hasImmediateAvailability: candidate.availability.immediate,
      
      // Historical matching
      previousMatchCount: 0, // Would need historical data
      previousSuccessRate: 0.5, // Default
    };
  }
  
  /**
   * Build complete feature vector for ML model
   */
  async buildFeatureVector(
    candidate: CaregiverCandidate,
    careRequest: CareRequest
  ): Promise<FeatureVector> {
    const caregiverFeatures = await this.computeCaregiverFeatures(candidate);
    const requestFeatures = await this.computeCareRequestFeatures(careRequest);
    const matchFeatures = await this.computeMatchFeatures(
      caregiverFeatures,
      requestFeatures,
      candidate,
      careRequest
    );
    
    return {
      // Candidate features
      experienceYears: caregiverFeatures.experienceYears,
      skillCount: caregiverFeatures.skillCount,
      avgRating: caregiverFeatures.avgRating,
      completedRequests: caregiverFeatures.completedRequestsTotal,
      acceptanceRate: caregiverFeatures.acceptanceRate,
      responseTimeMinutes: caregiverFeatures.avgResponseTimeMinutes,
      distanceKm: matchFeatures.distanceKm,
      
      // Request features
      requiredSkillCount: requestFeatures.requiredSkillCount,
      budgetRangeLow: requestFeatures.budgetMin,
      budgetRangeHigh: requestFeatures.budgetMax,
      urgencyLevel: requestFeatures.urgencyLevel,
      estimatedHoursPerWeek: requestFeatures.estimatedHoursPerWeek,
      
      // Match features
      skillMatchRatio: matchFeatures.skillMatchRatio,
      languageMatch: this.hasLanguageMatch(candidate, careRequest),
      locationScore: matchFeatures.isWithinPreferredRadius ? 1 : 0.5,
      availabilityOverlap: matchFeatures.availabilityOverlap,
      budgetCompatibility: matchFeatures.budgetCompatibility,
      
      // Derived features
      experienceWeightedRating: caregiverFeatures.experienceWeightedRating,
      recentActivityScore: caregiverFeatures.activityScore,
      specialtyAlignmentScore: matchFeatures.skillMatchRatio,
    };
  }
  
  /**
   * Batch feature retrieval
   */
  async getCaregiverFeaturesBatch(
    caregiverIds: string[]
  ): Promise<Map<string, CaregiverFeatures>> {
    const result = new Map<string, CaregiverFeatures>();
    
    if (!this.redis) return result;
    
    const keys = caregiverIds.map(id => `features:caregiver:${this.FEATURE_VERSION}:${id}`);
    
    try {
      const values = await this.redis.mget(...keys);
      
      for (let i = 0; i < caregiverIds.length; i++) {
        const value = values[i];
        if (value) {
          result.set(caregiverIds[i], JSON.parse(value));
        }
      }
    } catch (error) {
      this.logger.warn(`Batch cache read failed: ${error}`);
    }
    
    return result;
  }
  
  // Helper methods
  
  private hasWeekendAvailability(candidate: CaregiverCandidate): boolean {
    const schedule = candidate.availability.schedule;
    return !!(schedule['saturday']?.length || schedule['sunday']?.length);
  }
  
  private calculateProfileCompleteness(candidate: CaregiverCandidate): number {
    let score = 0;
    let total = 0;
    
    if (candidate.skills.length > 0) score++; total++;
    if (candidate.certifications.length > 0) score++; total++;
    if (candidate.languages.length > 0) score++; total++;
    if (candidate.experienceYears > 0) score++; total++;
    if (candidate.location.city) score++; total++;
    if (candidate.metrics.rating > 0) score++; total++;
    
    return total > 0 ? score / total : 0;
  }
  
  private calculateReliabilityScore(candidate: CaregiverCandidate): number {
    return (
      candidate.metrics.acceptanceRate * 0.4 +
      (1 - candidate.metrics.cancellationRate) * 0.4 +
      Math.min(1, candidate.metrics.completedCareRequests / 50) * 0.2
    );
  }
  
  private calculateActivityScore(candidate: CaregiverCandidate): number {
    // Based on response time and completed requests
    const responseScore = Math.max(0, 1 - candidate.metrics.responseTimeMinutes / 1440);
    const requestScore = Math.min(1, candidate.metrics.completedCareRequests / 100);
    return (responseScore + requestScore) / 2;
  }
  
  private calculateQualityScore(candidate: CaregiverCandidate): number {
    return (
      (candidate.metrics.rating / 5) * 0.6 +
      candidate.metrics.acceptanceRate * 0.2 +
      (1 - candidate.metrics.cancellationRate) * 0.2
    );
  }
  
  private mapUrgencyToNumber(urgency?: string): number {
    switch (urgency) {
      case 'immediate': return 5;
      case 'urgent': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }
  
  private calculateBudgetCompatibility(
    budgetMin: number,
    budgetMax: number,
    rateMin: number,
    rateMax: number
  ): number {
    if (!budgetMax || !rateMin) return 0.9;
    
    if (rateMin > budgetMax) {
      return Math.max(0, 1 - (rateMin - budgetMax) / budgetMax);
    }
    
    if (budgetMin >= rateMax) {
      return 1;
    }
    
    const overlapStart = Math.max(budgetMin, rateMin);
    const overlapEnd = Math.min(budgetMax, rateMax);
    const budgetRange = budgetMax - budgetMin || 1;
    
    return Math.max(0, (overlapEnd - overlapStart) / budgetRange);
  }
  
  private calculatePriceDifference(budgetMax: number, rateMin: number): number {
    if (!budgetMax || !rateMin) return 0;
    return ((rateMin - budgetMax) / budgetMax) * 100;
  }
  
  private hasLanguageMatch(candidate: CaregiverCandidate, careRequest: CareRequest): boolean {
    if (!careRequest.preferredLanguages?.length) return true;
    return careRequest.preferredLanguages.some(lang =>
      candidate.languages.includes(lang)
    );
  }
}

// Feature interfaces
export interface CaregiverFeatures {
  experienceYears: number;
  skillCount: number;
  certificationCount: number;
  languageCount: number;
  hasLiveInCapability: boolean;
  hasOvernightCapability: boolean;
  hasWeekendAvailability: boolean;
  avgRating: number;
  ratingCount: number;
  completedRequestsTotal: number;
  completedRequestsLast30Days: number;
  completedRequestsLast90Days: number;
  acceptanceRate: number;
  cancellationRate: number;
  avgResponseTimeMinutes: number;
  profileCompleteness: number;
  lastActiveHoursAgo: number;
  daysOnPlatform: number;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  hourlyRateMin: number;
  hourlyRateMax: number;
  avgHourlyRate: number;
  reliabilityScore: number;
  experienceWeightedRating: number;
  activityScore: number;
  qualityScore: number;
}

export interface CareRequestFeatures {
  requiredSkillCount: number;
  requiredExperience: number;
  budgetMin: number;
  budgetMax: number;
  estimatedHoursPerWeek: number;
  urgencyLevel: number;
  hasLocationPreference: boolean;
  hasLanguagePreference: boolean;
  hasScheduleConstraints: boolean;
}

export interface MatchFeatures {
  skillMatchRatio: number;
  skillMatchCount: number;
  missingSkillCount: number;
  distanceKm: number;
  isWithinPreferredRadius: boolean;
  travelTimeMinutes: number;
  budgetCompatibility: number;
  isWithinBudget: boolean;
  priceDifferencePercent: number;
  availabilityOverlap: number;
  hasImmediateAvailability: boolean;
  previousMatchCount: number;
  previousSuccessRate: number;
}
































































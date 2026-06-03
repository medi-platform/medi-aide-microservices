import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CulturalProfile } from '../entities/cultural-profile.entity';

interface CulturalScore {
  overallScore: number;
  breakdown: {
    languageMatch: number;
    culturalAlignment: number;
    religiousCompatibility: number;
    communicationStyle: number;
    dietaryCompatibility: number;
  };
  insights: string[];
}

interface CaregiverCulturalProfile {
  userId: string;
  primaryCulture?: string;
  languages?: string[];
  religiousBackground?: string;
  culturalPreferences?: any;
}

interface PatientCulturalProfile {
  userId: string;
  primaryCulture?: string;
  preferredLanguage?: string;
  religiousBackground?: string;
  dietaryRestrictions?: string[];
  culturalPreferences?: any;
  culturalImportance: number;
}

@Injectable()
export class CulturalMatchingService {
  private readonly logger = new Logger(CulturalMatchingService.name);

  constructor(
    @InjectRepository(CulturalProfile)
    private readonly profileRepo: Repository<CulturalProfile>,
  ) {}

  /**
   * Calculate cultural compatibility score between caregiver and patient
   */
  async calculateCulturalScore(
    caregiverId: string,
    patientId: string,
  ): Promise<CulturalScore> {
    const [caregiverProfile, patientProfile] = await Promise.all([
      this.getProfile(caregiverId),
      this.getProfile(patientId),
    ]);

    if (!caregiverProfile || !patientProfile) {
      return this.getDefaultScore();
    }

    const languageMatch = this.calculateLanguageMatch(caregiverProfile, patientProfile);
    const culturalAlignment = this.calculateCulturalAlignment(caregiverProfile, patientProfile);
    const religiousCompatibility = this.calculateReligiousCompatibility(caregiverProfile, patientProfile);
    const communicationStyle = this.calculateCommunicationStyleMatch(caregiverProfile, patientProfile);
    const dietaryCompatibility = this.calculateDietaryCompatibility(caregiverProfile, patientProfile);

    const breakdown = {
      languageMatch,
      culturalAlignment,
      religiousCompatibility,
      communicationStyle,
      dietaryCompatibility,
    };

    // Weight based on patient's cultural importance preference
    const importanceMultiplier = (patientProfile.culturalImportance || 5) / 10;
    const weights = this.getWeights(importanceMultiplier);

    const overallScore = Math.round(
      languageMatch * weights.language +
      culturalAlignment * weights.cultural +
      religiousCompatibility * weights.religious +
      communicationStyle * weights.communication +
      dietaryCompatibility * weights.dietary
    );

    const insights = this.generateInsights(breakdown, caregiverProfile, patientProfile);

    return {
      overallScore,
      breakdown,
      insights,
    };
  }

  /**
   * Batch calculate cultural scores for multiple caregivers
   */
  async batchCalculateScores(
    caregiverIds: string[],
    patientId: string,
  ): Promise<Map<string, CulturalScore>> {
    const patientProfile = await this.getProfile(patientId);
    if (!patientProfile) {
      const defaultScore = this.getDefaultScore();
      return new Map(caregiverIds.map(id => [id, defaultScore]));
    }

    const caregiverProfiles = await this.profileRepo.find({
      where: { userId: In(caregiverIds), userType: 'caregiver' },
    });

    const profileMap = new Map(caregiverProfiles.map(p => [p.userId, p]));
    const results = new Map<string, CulturalScore>();

    for (const caregiverId of caregiverIds) {
      const caregiverProfile = profileMap.get(caregiverId);
      if (caregiverProfile) {
        const score = this.calculateScoreFromProfiles(caregiverProfile, patientProfile);
        results.set(caregiverId, score);
      } else {
        results.set(caregiverId, this.getDefaultScore());
      }
    }

    return results;
  }

  /**
   * Get or create cultural profile
   */
  async getProfile(userId: string): Promise<CulturalProfile | null> {
    return this.profileRepo.findOne({ where: { userId } });
  }

  /**
   * Update cultural profile
   */
  async updateProfile(
    userId: string,
    userType: 'caregiver' | 'patient',
    updates: Partial<CulturalProfile>,
  ): Promise<CulturalProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile) {
      profile = this.profileRepo.create({
        userId,
        userType,
        ...updates,
      });
    } else {
      Object.assign(profile, updates);
    }

    return this.profileRepo.save(profile);
  }

  /**
   * Calculate score from profiles (internal)
   */
  private calculateScoreFromProfiles(
    caregiverProfile: CulturalProfile,
    patientProfile: CulturalProfile,
  ): CulturalScore {
    const languageMatch = this.calculateLanguageMatch(caregiverProfile, patientProfile);
    const culturalAlignment = this.calculateCulturalAlignment(caregiverProfile, patientProfile);
    const religiousCompatibility = this.calculateReligiousCompatibility(caregiverProfile, patientProfile);
    const communicationStyle = this.calculateCommunicationStyleMatch(caregiverProfile, patientProfile);
    const dietaryCompatibility = this.calculateDietaryCompatibility(caregiverProfile, patientProfile);

    const breakdown = {
      languageMatch,
      culturalAlignment,
      religiousCompatibility,
      communicationStyle,
      dietaryCompatibility,
    };

    const importanceMultiplier = (patientProfile.culturalImportance || 5) / 10;
    const weights = this.getWeights(importanceMultiplier);

    const overallScore = Math.round(
      languageMatch * weights.language +
      culturalAlignment * weights.cultural +
      religiousCompatibility * weights.religious +
      communicationStyle * weights.communication +
      dietaryCompatibility * weights.dietary
    );

    return {
      overallScore,
      breakdown,
      insights: this.generateInsights(breakdown, caregiverProfile, patientProfile),
    };
  }

  /**
   * Calculate language match score
   */
  private calculateLanguageMatch(
    caregiver: CulturalProfile,
    patient: CulturalProfile,
  ): number {
    if (!patient.preferredLanguage || !caregiver.languages) {
      return 80; // Default neutral score
    }

    const preferredLang = patient.preferredLanguage.toLowerCase();
    const caregiverLangs = (caregiver.languages || []).map(l => l.toLowerCase());

    if (caregiverLangs.includes(preferredLang)) {
      return 100;
    }

    // Check for any common languages
    const patientLangs = (patient.languages || []).map(l => l.toLowerCase());
    const commonLangs = caregiverLangs.filter(l => patientLangs.includes(l));

    if (commonLangs.length > 0) {
      return 85;
    }

    return 50;
  }

  /**
   * Calculate cultural alignment score
   */
  private calculateCulturalAlignment(
    caregiver: CulturalProfile,
    patient: CulturalProfile,
  ): number {
    let score = 70;

    if (caregiver.primaryCulture && patient.primaryCulture) {
      if (caregiver.primaryCulture === patient.primaryCulture) {
        score = 100;
      } else if (
        caregiver.secondaryCultures?.includes(patient.primaryCulture) ||
        patient.secondaryCultures?.includes(caregiver.primaryCulture)
      ) {
        score = 90;
      }
    }

    return score;
  }

  /**
   * Calculate religious compatibility score
   */
  private calculateReligiousCompatibility(
    caregiver: CulturalProfile,
    patient: CulturalProfile,
  ): number {
    const patientPreference = patient.culturalPreferences?.religiousCompatibility || 'any';

    if (patientPreference === 'any') {
      return 100;
    }

    if (patientPreference === 'secular') {
      return 80; // Neutral
    }

    if (patientPreference === 'same_religion') {
      if (caregiver.religiousBackground === patient.religiousBackground) {
        return 100;
      }
      return 60;
    }

    return 80;
  }

  /**
   * Calculate communication style match
   */
  private calculateCommunicationStyleMatch(
    caregiver: CulturalProfile,
    patient: CulturalProfile,
  ): number {
    if (!caregiver.communicationStyle || !patient.communicationStyle) {
      return 80;
    }

    let score = 80;
    const cStyle = caregiver.communicationStyle;
    const pStyle = patient.communicationStyle;

    // Directness match
    if (cStyle.directness === pStyle.directness) {
      score += 10;
    } else if (pStyle.directness === 'balanced') {
      score += 5;
    }

    // Physical touch compatibility
    if (pStyle.physicalTouch === 'avoid' && cStyle.physicalTouch === 'comfortable') {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate dietary compatibility
   */
  private calculateDietaryCompatibility(
    caregiver: CulturalProfile,
    patient: CulturalProfile,
  ): number {
    if (!patient.dietaryRestrictions || patient.dietaryRestrictions.length === 0) {
      return 100;
    }

    // Check if caregiver has food traditions that conflict
    const caregiverTraditions = (caregiver.foodTraditions || []).map(t => t.toLowerCase());
    const patientRestrictions = patient.dietaryRestrictions.map(r => r.toLowerCase());

    // Check for major conflicts
    const conflicts = patientRestrictions.filter(r => 
      caregiverTraditions.some(t => 
        (r === 'halal' && t.includes('pork')) ||
        (r === 'kosher' && t.includes('shellfish')) ||
        (r === 'vegetarian' && t.includes('meat'))
      )
    );

    if (conflicts.length > 0) {
      return 60;
    }

    return 90;
  }

  /**
   * Get scoring weights based on cultural importance
   */
  private getWeights(importanceMultiplier: number): {
    language: number;
    cultural: number;
    religious: number;
    communication: number;
    dietary: number;
  } {
    // Higher importance = higher weights on cultural factors
    return {
      language: 0.35,
      cultural: 0.25 * importanceMultiplier + 0.15,
      religious: 0.15 * importanceMultiplier + 0.05,
      communication: 0.15,
      dietary: 0.10,
    };
  }

  /**
   * Generate cultural matching insights
   */
  private generateInsights(
    breakdown: CulturalScore['breakdown'],
    caregiver: CulturalProfile,
    patient: CulturalProfile,
  ): string[] {
    const insights: string[] = [];

    if (breakdown.languageMatch === 100) {
      insights.push(`Speaks ${patient.preferredLanguage} fluently`);
    } else if (breakdown.languageMatch < 70) {
      insights.push('Language barrier may require attention');
    }

    if (breakdown.culturalAlignment >= 90) {
      insights.push('Strong cultural alignment');
    }

    if (breakdown.religiousCompatibility === 100 && patient.religiousBackground) {
      insights.push('Religious compatibility confirmed');
    }

    if (breakdown.dietaryCompatibility < 80) {
      insights.push('Dietary considerations may need discussion');
    }

    return insights;
  }

  /**
   * Get default score when profiles are incomplete
   */
  private getDefaultScore(): CulturalScore {
    return {
      overallScore: 75,
      breakdown: {
        languageMatch: 75,
        culturalAlignment: 75,
        religiousCompatibility: 100,
        communicationStyle: 75,
        dietaryCompatibility: 100,
      },
      insights: ['Cultural profile incomplete - using default compatibility'],
    };
  }
}


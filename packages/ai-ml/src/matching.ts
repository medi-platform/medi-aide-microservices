/**
 * Smart Caregiver-Patient Matching Algorithm
 * Uses weighted scoring and compatibility analysis
 */

import { Injectable } from '@nestjs/common';

export interface CaregiverProfile {
  id: string;
  skills: string[];
  certifications: string[];
  languages: string[];
  experience: number; // years
  rating: number; // 1-5
  availability: AvailabilitySlot[];
  location: { lat: number; lng: number };
  preferences: {
    maxDistance?: number;
    preferredShiftTypes?: string[];
    avoidConditions?: string[];
  };
  workHistory: {
    totalShifts: number;
    completionRate: number;
    onTimeRate: number;
    cancelRate: number;
  };
}

export interface PatientProfile {
  id: string;
  requiredSkills: string[];
  preferredLanguages: string[];
  conditions: string[];
  careLevel: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lng: number };
  preferences: {
    preferredGender?: 'male' | 'female' | 'any';
    preferredAge?: { min?: number; max?: number };
    continuityPreference?: 'high' | 'medium' | 'low';
  };
  history: {
    previousCaregivers: string[];
    favoriteCaregiver?: string;
    blockedCaregivers: string[];
  };
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ShiftRequirement {
  patientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  requiredSkills: string[];
  priority: 'normal' | 'high' | 'urgent';
}

export interface MatchResult {
  caregiverId: string;
  patientId: string;
  score: number;
  breakdown: {
    skillMatch: number;
    languageMatch: number;
    distanceScore: number;
    availabilityScore: number;
    reliabilityScore: number;
    compatibilityScore: number;
    continuityBonus: number;
  };
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export interface MatchingConfig {
  weights: {
    skills: number;
    language: number;
    distance: number;
    availability: number;
    reliability: number;
    compatibility: number;
    continuity: number;
  };
  thresholds: {
    minimumScore: number;
    maxDistance: number; // km
    minimumReliability: number;
  };
}

const DEFAULT_CONFIG: MatchingConfig = {
  weights: {
    skills: 0.25,
    language: 0.10,
    distance: 0.15,
    availability: 0.15,
    reliability: 0.15,
    compatibility: 0.10,
    continuity: 0.10,
  },
  thresholds: {
    minimumScore: 0.6,
    maxDistance: 50,
    minimumReliability: 0.7,
  },
};

@Injectable()
export class MatchingEngine {
  private config: MatchingConfig;

  constructor(config: Partial<MatchingConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: { ...DEFAULT_CONFIG.weights, ...config.weights },
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
    };
  }

  /**
   * Find best matching caregivers for a patient
   */
  findMatches(
    patient: PatientProfile,
    caregivers: CaregiverProfile[],
    shift: ShiftRequirement,
    limit: number = 10,
  ): MatchResult[] {
    const results: MatchResult[] = [];

    for (const caregiver of caregivers) {
      // Skip blocked caregivers
      if (patient.history.blockedCaregivers.includes(caregiver.id)) {
        continue;
      }

      const match = this.calculateMatch(patient, caregiver, shift);

      if (match.score >= this.config.thresholds.minimumScore) {
        results.push(match);
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Calculate match score between caregiver and patient
   */
  calculateMatch(
    patient: PatientProfile,
    caregiver: CaregiverProfile,
    shift: ShiftRequirement,
  ): MatchResult {
    const warnings: string[] = [];

    // Calculate individual scores
    const skillMatch = this.calculateSkillMatch(
      patient.requiredSkills,
      caregiver.skills,
      caregiver.certifications,
    );

    const languageMatch = this.calculateLanguageMatch(
      patient.preferredLanguages,
      caregiver.languages,
    );

    const distanceScore = this.calculateDistanceScore(
      patient.location,
      caregiver.location,
    );

    const availabilityScore = this.calculateAvailabilityScore(
      shift,
      caregiver.availability,
    );

    const reliabilityScore = this.calculateReliabilityScore(caregiver.workHistory);

    const compatibilityScore = this.calculateCompatibilityScore(patient, caregiver);

    const continuityBonus = this.calculateContinuityBonus(patient, caregiver);

    // Check for warnings
    if (skillMatch < 0.8) {
      warnings.push('Caregiver may lack some required skills');
    }
    if (distanceScore < 0.5) {
      warnings.push('Caregiver is relatively far from patient');
    }
    if (reliabilityScore < 0.7) {
      warnings.push('Caregiver has lower reliability score');
    }
    if (caregiver.preferences.avoidConditions?.some(c => patient.conditions.includes(c))) {
      warnings.push('Caregiver has preference to avoid certain conditions');
    }

    // Calculate weighted total score
    const { weights } = this.config;
    const score =
      skillMatch * weights.skills +
      languageMatch * weights.language +
      distanceScore * weights.distance +
      availabilityScore * weights.availability +
      reliabilityScore * weights.reliability +
      compatibilityScore * weights.compatibility +
      continuityBonus * weights.continuity;

    // Determine confidence
    const confidence = this.determineConfidence(score, warnings.length);

    return {
      caregiverId: caregiver.id,
      patientId: patient.id,
      score: Math.round(score * 100) / 100,
      breakdown: {
        skillMatch: Math.round(skillMatch * 100) / 100,
        languageMatch: Math.round(languageMatch * 100) / 100,
        distanceScore: Math.round(distanceScore * 100) / 100,
        availabilityScore: Math.round(availabilityScore * 100) / 100,
        reliabilityScore: Math.round(reliabilityScore * 100) / 100,
        compatibilityScore: Math.round(compatibilityScore * 100) / 100,
        continuityBonus: Math.round(continuityBonus * 100) / 100,
      },
      confidence,
      warnings,
    };
  }

  private calculateSkillMatch(
    required: string[],
    skills: string[],
    certifications: string[],
  ): number {
    if (required.length === 0) return 1;

    const allSkills = [...skills, ...certifications];
    const matched = required.filter((r) =>
      allSkills.some((s) => s.toLowerCase().includes(r.toLowerCase())),
    );

    return matched.length / required.length;
  }

  private calculateLanguageMatch(preferred: string[], spoken: string[]): number {
    if (preferred.length === 0) return 1;

    const matched = preferred.filter((p) =>
      spoken.some((s) => s.toLowerCase() === p.toLowerCase()),
    );

    return matched.length > 0 ? 1 : 0.5;
  }

  private calculateDistanceScore(
    patientLoc: { lat: number; lng: number },
    caregiverLoc: { lat: number; lng: number },
  ): number {
    const distance = this.haversineDistance(patientLoc, caregiverLoc);
    const maxDistance = this.config.thresholds.maxDistance;

    if (distance <= 5) return 1;
    if (distance >= maxDistance) return 0;

    return 1 - (distance - 5) / (maxDistance - 5);
  }

  private haversineDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lng - loc1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateAvailabilityScore(
    shift: ShiftRequirement,
    availability: AvailabilitySlot[],
  ): number {
    const shiftDay = shift.date.getDay();
    const shiftStart = shift.startTime;
    const shiftEnd = shift.endTime;

    const matchingSlot = availability.find(
      (slot) =>
        slot.dayOfWeek === shiftDay &&
        slot.startTime <= shiftStart &&
        slot.endTime >= shiftEnd,
    );

    return matchingSlot ? 1 : 0;
  }

  private calculateReliabilityScore(history: CaregiverProfile['workHistory']): number {
    if (history.totalShifts < 5) return 0.7; // New caregiver

    const completionWeight = 0.4;
    const onTimeWeight = 0.4;
    const cancelWeight = 0.2;

    return (
      history.completionRate * completionWeight +
      history.onTimeRate * onTimeWeight +
      (1 - history.cancelRate) * cancelWeight
    );
  }

  private calculateCompatibilityScore(
    patient: PatientProfile,
    caregiver: CaregiverProfile,
  ): number {
    let score = 1;

    // Care level experience
    if (patient.careLevel === 'critical' && caregiver.experience < 3) {
      score *= 0.7;
    }
    if (patient.careLevel === 'high' && caregiver.experience < 2) {
      score *= 0.8;
    }

    // Rating factor
    score *= 0.5 + (caregiver.rating / 5) * 0.5;

    return score;
  }

  private calculateContinuityBonus(
    patient: PatientProfile,
    caregiver: CaregiverProfile,
  ): number {
    // Favorite caregiver gets full bonus
    if (patient.history.favoriteCaregiver === caregiver.id) {
      return 1;
    }

    // Previous caregivers get partial bonus
    if (patient.history.previousCaregivers.includes(caregiver.id)) {
      return 0.7;
    }

    return 0;
  }

  private determineConfidence(
    score: number,
    warningCount: number,
  ): 'high' | 'medium' | 'low' {
    if (score >= 0.85 && warningCount === 0) return 'high';
    if (score >= 0.7 && warningCount <= 1) return 'medium';
    return 'low';
  }
}

/**
 * Bulk matching for schedule optimization
 */
export function optimizeSchedule(
  shifts: ShiftRequirement[],
  caregivers: CaregiverProfile[],
  patients: Map<string, PatientProfile>,
  engine: MatchingEngine,
): Map<string, MatchResult[]> {
  const assignments = new Map<string, MatchResult[]>();
  const caregiverAssignments = new Map<string, number>();

  // Sort shifts by priority
  const sortedShifts = [...shifts].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  for (const shift of sortedShifts) {
    const patient = patients.get(shift.patientId);
    if (!patient) continue;

    // Find matches
    let matches = engine.findMatches(patient, caregivers, shift, 5);

    // Consider workload balance
    matches = matches.map((match) => {
      const currentLoad = caregiverAssignments.get(match.caregiverId) || 0;
      const loadPenalty = Math.min(currentLoad * 0.05, 0.2);
      return { ...match, score: match.score - loadPenalty };
    });

    // Re-sort after penalty
    matches.sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      assignments.set(shift.patientId + '-' + shift.date.toISOString(), matches);

      // Track assignment
      const bestMatch = matches[0];
      caregiverAssignments.set(
        bestMatch.caregiverId,
        (caregiverAssignments.get(bestMatch.caregiverId) || 0) + 1,
      );
    }
  }

  return assignments;
}

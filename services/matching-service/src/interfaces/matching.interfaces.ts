/**
 * Enterprise AI Matching System - Core Interfaces
 * 
 * Uber-grade matching interfaces for caregiver-patient matching
 * with support for ML scoring, real-time updates, and performance monitoring.
 */

/**
 * Represents a caregiver candidate with all relevant matching attributes
 */
export interface CaregiverCandidate {
  id: string;
  userId: string;
  
  // Professional attributes
  experienceYears: number;
  skills: string[];
  certifications: string[];
  specializations: string[];
  languages: string[];
  
  // Availability
  availability: {
    schedule: WeeklyAvailability;
    immediate: boolean;
    overnight: boolean;
    liveIn: boolean;
  };
  
  // Location
  location: {
    latitude: number;
    longitude: number;
    city: string;
    province: string;
    postalCode: string;
    h3Index?: string; // H3 hexagonal index
  };
  
  // Performance metrics
  metrics: {
    rating: number;
    completedCareRequests: number;
    responseTimeMinutes: number;
    acceptanceRate: number; // 0-1
    cancellationRate: number;
    reliabilityScore: number;
  };
  
  // Preferences
  preferences: {
    maxDistanceKm: number;
    careTypes: string[];
    patientConditions: string[];
    hourlyRateMin?: number;
    hourlyRateMax?: number;
  };
  
  // Pre-calculated enrichment fields
  calculatedDistanceKm?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
}

/**
 * Weekly availability schedule
 */
export interface WeeklyAvailability {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

/**
 * Care request for matching
 */
export interface CareRequest {
  id: string;
  patientId: string;
  
  // Care requirements
  careType: string;
  requiredSkills: string[];
  requiredExperience?: number;
  preferredLanguages?: string[];
  
  // Location
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    province?: string;
    postalCode?: string;
    address?: string;
  };
  
  // Schedule
  schedule?: {
    startDate?: Date;
    endDate?: Date;
    hoursPerWeek?: number;
    timeSlots?: Array<{
      day: string;
      start: string;
      end: string;
    }>;
  };
  requestedTimeSlots?: Array<{
    day: string;
    start: string;
    end: string;
  }>;
  
  // Budget
  budgetMin?: number;
  budgetMax?: number;
  
  // Urgency
  urgency?: 'low' | 'normal' | 'high' | 'urgent' | 'immediate';
  
  // Additional
  estimatedHoursPerWeek?: number;
  carePlanDuration?: string;
  status: string;
  createdAt: Date;
}

/**
 * Scored match result
 */
export interface ScoredMatch {
  candidateId: string;
  score: number; // 0-100
  
  // Detailed scoring breakdown
  breakdown: ScoreBreakdown;
  
  // Matching insights
  insights: MatchInsights;
  
  // Ranking metadata
  rank: number;
  confidence: number; // 0-1
}

/**
 * Score breakdown - supports full breakdown and heuristic/fallback modes
 */
export interface ScoreBreakdown {
  skillMatch?: number;
  experienceMatch?: number;
  availabilityMatch?: number;
  distanceScore?: number;
  performanceScore?: number;
  preferenceAlignment?: number;
  budgetCompatibility?: number;
  // Support for heuristic/fallback scoring
  heuristic?: boolean;
  fallback?: boolean;
}

/**
 * Match insights for explanation
 */
export interface MatchInsights {
  matchedSkills: string[];
  distanceKm: number;
  estimatedResponseTime: number;
  strengths: string[];
  considerations: string[];
  budgetInfo?: {
    patientBudgetMin?: number;
    patientBudgetMax?: number;
    caregiverRateMin?: number;
    caregiverRateMax?: number;
    compatibilityScore: number;
  };
}

/**
 * Interface for AI scoring implementations
 */
export interface IAIScorer {
  scoreMatches(
    careRequest: CareRequest,
    candidates: CaregiverCandidate[]
  ): Promise<ScoredMatch[]>;
  
  getVersion(): string;
  healthCheck(): Promise<boolean>;
}

/**
 * Interface for candidate fetching strategies
 */
export interface ICandidateFetcher {
  getCandidates(
    careRequest: CareRequest,
    options?: CandidateFetchOptions
  ): Promise<CaregiverCandidate[]>;
}

export interface CandidateFetchOptions {
  maxCandidates?: number;
  maxDistanceKm?: number;
  includeInactive?: boolean;
  skillsRequired?: boolean;
  certificationsRequired?: string[];
  relaxedMode?: boolean;
}

/**
 * Interface for match result persistence
 */
export interface IMatchResultService {
  saveMatches(careRequestId: string, matches: ScoredMatch[]): Promise<void>;
  getMatches(careRequestId: string, options?: MatchRetrievalOptions): Promise<ScoredMatch[]>;
}

export interface MatchRetrievalOptions {
  limit?: number;
  minScore?: number;
  includeDeclined?: boolean;
}

/**
 * Matching orchestrator options
 */
export interface MatchingOptions {
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retryAttempts?: number;
  enableMetrics?: boolean;
  maxDistanceKm?: number;
  skillsRequired?: boolean;
  useTemporalWorkflow?: boolean;
}

/**
 * Matching metrics for monitoring
 */
export interface MatchingMetrics {
  careRequestId: string;
  timestamp: Date;
  duration: number; // milliseconds
  candidateCount?: number;
  matchCount?: number;
  topScore?: number;
  averageScore?: number;
  scorerVersion?: string;
  cacheHit?: boolean;
  errors: string[];
  mlModelUsed?: boolean;
  mlModelVersion?: string;
  region?: string;
  h3CellId?: string;
  slaMet?: boolean;
  slaTargetMs?: number;
}

/**
 * Event payload for match completion
 */
export interface MatchCompletedPayload {
  careRequestId: string;
  matchCount: number;
  topMatches: Array<{
    candidateId: string;
    score: number;
  }>;
  metrics: MatchingMetrics;
}

/**
 * Kafka event types for matching
 */
export enum MatchingEventType {
  MATCHING_STARTED = 'matching.started',
  MATCHING_PROGRESS = 'matching.progress',
  MATCHING_COMPLETED = 'matching.completed',
  MATCHING_FAILED = 'matching.failed',
  MATCHES_READY = 'matching.matches.ready',
  CAREGIVER_LOCATION_UPDATED = 'caregiver.location.updated',
  CAREGIVER_INVITED = 'caregiver.invited',
  CAREGIVER_ACCEPTED = 'caregiver.accepted',
  CAREGIVER_DECLINED = 'caregiver.declined',
}

/**
 * Feature vector for ML scoring
 */
export interface FeatureVector {
  // Candidate features
  experienceYears: number;
  skillCount: number;
  avgRating: number;
  completedRequests: number;
  acceptanceRate: number;
  responseTimeMinutes: number;
  distanceKm: number;
  
  // Request features
  requiredSkillCount: number;
  budgetRangeLow?: number;
  budgetRangeHigh?: number;
  urgencyLevel: number;
  estimatedHoursPerWeek?: number;
  
  // Match features
  skillMatchRatio: number;
  languageMatch: boolean;
  locationScore: number;
  availabilityOverlap: number;
  budgetCompatibility: number;
  
  // Derived features
  experienceWeightedRating: number;
  recentActivityScore: number;
  specialtyAlignmentScore: number;
}

/**
 * A/B Test experiment
 */
export interface Experiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  variants: ExperimentVariant[];
  allocation: {
    type: 'random' | 'sticky' | 'percentage';
    percentages: Record<string, number>;
  };
  targeting: {
    userGroups?: string[];
    regions?: string[];
    careTypes?: string[];
    sampleRate: number;
  };
  primaryMetric: string;
  secondaryMetrics: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  isControl: boolean;
  config: Record<string, any>;
}

/**
 * Surge pricing result
 */
export interface SurgePriceResult {
  zoneId: string;
  surgeMultiplier: number;
  basePriceModifier: number;
  factors: SurgeFactors;
  recommendation: {
    action: 'increase' | 'decrease' | 'maintain';
    reason: string;
    estimatedImpact: {
      caregiverSupply: string;
      patientDemand: string;
    };
  };
}

export interface SurgeFactors {
  supplyCount: number;
  demandCount: number;
  supplyDemandRatio: number;
  timeOfDayFactor: number;
  dayOfWeekFactor: number;
  historicalFactor: number;
  weatherFactor: number;
  eventFactor: number;
}


















































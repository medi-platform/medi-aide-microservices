/**
 * Common type definitions for the wellness microservice
 * Enterprise-grade strongly typed interfaces
 */

// User type for authentication context
export interface AuthenticatedUser {
  uid: string;
  id?: string;
  sub?: string;
  email?: string;
  roles?: string[];
}

// Physio trends data structure
export interface PhysioTrendData {
  metric: string;
  values: number[];
  timestamps: Date[];
  average: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Correlation data structure
export interface CorrelationData {
  id: string;
  userId: string;
  metricA: string;
  metricB: string;
  correlationCoefficient: number;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
  interpretation?: string;
}

// Intervention statistics
export interface InterventionStats {
  totalDelivered: number;
  totalOpened: number;
  totalEngaged: number;
  avgEngagementRate: number;
  byType: Record<string, {
    delivered: number;
    opened: number;
    engaged: number;
    avgRating?: number;
  }>;
  recentFeedback: Array<{
    interventionId: string;
    rating: number;
    feedback?: string;
    createdAt: Date;
  }>;
}

// Wellness summary response
export interface WellnessSummaryResponse {
  physioTrends: Record<string, PhysioTrendData>;
  correlations: CorrelationData[];
  interventions: InterventionStats;
  insights: string[];
}

// Device sync settings
export interface DeviceSyncSettings {
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'realtime';
  enabledMetrics: string[];
  lastFullSync?: Date;
  incrementalSync: boolean;
}

// Error log entry
export interface ErrorLogEntry {
  timestamp: Date;
  error: string;
  details?: {
    statusCode?: number;
    message?: string;
    stack?: string;
    [key: string]: unknown;
  };
  retryCount?: number;
}

// Device info
export interface DeviceInfo {
  battery?: number;
  model?: string;
  firmware?: string;
  manufacturer?: string;
  lastSeen?: Date;
  garminUserId?: string;
  pushRegistered?: boolean;
  pushRegisteredAt?: string;
  deviceType?: string;
}

// Stimulus event data
export interface StimulusEventData {
  intensity?: number;
  duration?: number;
  context?: string;
  [key: string]: unknown;
}

// Manual intervention data
export interface ManualInterventionData {
  customMessage?: string;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

// OAuth state data
export interface OAuthStateData {
  userId: string;
  source: string;
  timestamp: number;
  nonce: string;
}

// Sync job progress
export interface SyncJobProgress {
  status: string;
  progress: number;
  result?: {
    success: boolean;
    samplesProcessed: number;
    duplicatesFound: number;
    errors?: string[];
    duration: number;
  };
  error?: string;
}

// Test data generation parameters
export interface TestDataParams {
  metric?: string;
  days?: number;
  samplesPerDay?: number;
  noise?: number;
}

// Cooldown status
export interface CooldownStatus {
  type: string;
  canDeliver: boolean;
  lastDelivered?: Date;
  nextAvailable?: Date;
  cooldownMinutes: number;
}

// Burnout risk levels
export type BurnoutRiskLabel = 'Low' | 'Medium' | 'High' | 'Critical';

// Burnout calculation result
export interface BurnoutCalculationResult {
  burnoutScore: number;
  label: BurnoutRiskLabel;
  advice: string;
  colorScheme: string;
}

// Vitals reading
export interface VitalsReading {
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical' | 'informational';
}

// Blood pressure reading
export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

// Vitals collection
export interface VitalsCollection {
  heartRate?: VitalsReading;
  bloodPressure?: BloodPressureReading;
  temperature?: VitalsReading;
  oxygenSaturation?: VitalsReading;
  respiratoryRate?: VitalsReading;
  hrvRmssd?: VitalsReading;
}

// Vitals summary
export interface VitalsSummary {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  alertCount: number;
  lastUpdated: string;
}

// Wearable status enum
export enum WearableStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  SYNCING = 'syncing',
  ERROR = 'error',
  PENDING = 'pending',
}

// Encrypted wearable auth
export interface EncryptedWearableAuth {
  iv: string;
  encryptedData: string;
  authTag: string;
  algorithm: string;
  keyId?: string;
}

// Recommendation priority
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Mood types
export type MoodType = 'happy' | 'neutral' | 'sad' | 'stressed' | 'anxious' | 'energetic';

// Wellness score components
export interface WellnessScoreComponents {
  physical: number;
  mental: number;
  emotional: number;
  social: number;
  workLifeBalance: number;
}

// Wellness score result
export interface WellnessScoreResult {
  overallScore: number;
  components: WellnessScoreComponents;
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  analyzedAt: Date;
}


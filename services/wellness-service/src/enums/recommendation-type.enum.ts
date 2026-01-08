/**
 * Recommendation type enumeration
 * Defines the source/type of wellness recommendations
 */
export enum RecommendationType {
  AI = 'ai',
  MANUAL = 'manual',
  SYSTEM = 'system',
  WEARABLE = 'wearable',
  CLINICAL = 'clinical',
  PEER = 'peer',
  WELLNESS_COACH = 'wellness_coach',
}

/**
 * Recommendation category enumeration
 */
export enum RecommendationCategory {
  PHYSICAL = 'physical',
  MENTAL = 'mental',
  EMOTIONAL = 'emotional',
  SOCIAL = 'social',
  SLEEP = 'sleep',
  NUTRITION = 'nutrition',
  EXERCISE = 'exercise',
  STRESS_MANAGEMENT = 'stress_management',
  WORK_LIFE_BALANCE = 'work_life_balance',
}

/**
 * Intervention type enumeration
 */
export enum InterventionType {
  NOTIFICATION = 'notification',
  BREATHING_EXERCISE = 'breathing_exercise',
  MINDFULNESS = 'mindfulness',
  BREAK_REMINDER = 'break_reminder',
  HYDRATION_REMINDER = 'hydration_reminder',
  POSTURE_CHECK = 'posture_check',
  STRETCH_REMINDER = 'stretch_reminder',
  PEER_SUPPORT = 'peer_support',
  ESCALATION = 'escalation',
  SLEEP_HYGIENE = 'sleep_hygiene',
  PROFESSIONAL_SUPPORT = 'professional_support',
  PHYSICAL_ACTIVITY = 'physical_activity',
  SOCIAL_CONNECTION = 'social_connection',
  GRATITUDE_PRACTICE = 'gratitude_practice',
  WORK_BOUNDARY = 'work_boundary',
}

/**
 * Wellness metric type enumeration
 */
export enum WellnessMetricType {
  HEART_RATE = 'HR',
  HRV_RMSSD = 'HRV_RMSSD',
  SPO2 = 'SpO2',
  STEPS = 'STEPS',
  CALORIES = 'CALORIES',
  SLEEP_DURATION = 'SLEEP_DURATION',
  SLEEP_QUALITY = 'SLEEP_QUALITY',
  STRESS_LEVEL = 'STRESS_LEVEL',
  ACTIVE_MINUTES = 'ACTIVE_MINUTES',
  FLOORS_CLIMBED = 'FLOORS_CLIMBED',
  DISTANCE = 'DISTANCE',
  BODY_BATTERY = 'BODY_BATTERY',
  INTENSITY_MINUTES = 'INTENSITY_MINUTES',
}

/**
 * Consent type enumeration
 */
export enum ConsentType {
  DATA_COLLECTION = 'data_collection',
  DATA_SHARING = 'data_sharing',
  WEARABLE_SYNC = 'wearable_sync',
  AI_ANALYSIS = 'ai_analysis',
  NOTIFICATIONS = 'notifications',
  RESEARCH = 'research',
}

/**
 * Wearable source enumeration
 */
export enum WearableSource {
  FITBIT = 'fitbit',
  GARMIN = 'garmin',
  APPLE_HEALTH = 'apple_health',
  GOOGLE_FIT = 'google_fit',
  SAMSUNG_HEALTH = 'samsung_health',
  WHOOP = 'whoop',
  OURA = 'oura',
  WITHINGS = 'withings',
}


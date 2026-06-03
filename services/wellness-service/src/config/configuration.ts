/**
 * Wellness Service Configuration
 * 
 * Environment variables for wearable integrations, database, Kafka, and service auth.
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'wellness-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || process.env.PORT || '4011', 10),
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'wellness_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(',').map(s => s.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || 'wellness-service',
    groupId: process.env.KAFKA_GROUP_ID || 'wellness-service-group',
    ssl: process.env.KAFKA_SSL === 'true',
  },

  // Service Auth Configuration
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,user-service,caregiver-service')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  },

  // Wearable Integrations - Fitbit
  fitbit: {
    clientId: process.env.FITBIT_CLIENT_ID || '',
    clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBaseUrl: 'https://api.fitbit.com/1/user/-',
    scopes: ['activity', 'heartrate', 'sleep', 'profile'],
    redirectUri: process.env.FITBIT_REDIRECT_URI || '',
  },

  // Wearable Integrations - Garmin
  garmin: {
    clientId: process.env.GARMIN_CLIENT_ID || '',
    clientSecret: process.env.GARMIN_CLIENT_SECRET || '',
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
    apiBaseUrl: 'https://apis.garmin.com/wellness-api/rest',
    scopes: ['activity', 'health', 'sleep'],
    redirectUri: process.env.GARMIN_REDIRECT_URI || '',
  },

  // Wearable Integrations - Samsung Health
  samsung: {
    clientId: process.env.SAMSUNG_CLIENT_ID || '',
    clientSecret: process.env.SAMSUNG_CLIENT_SECRET || '',
    apiBaseUrl: 'https://api.health.samsung.com',
    redirectUri: process.env.SAMSUNG_REDIRECT_URI || '',
  },

  // AI/ML Service Integration
  ai: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://stage3-ai-ml-service:5000',
    burnoutPredictionEndpoint: '/api/v1/predict/burnout',
    recommendationsEndpoint: '/api/v1/recommendations',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
  },

  // Redis/Cache Configuration
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Sync Configuration
  sync: {
    defaultFrequencyMinutes: parseInt(process.env.SYNC_FREQUENCY_MINUTES || '60', 10),
    maxRetries: parseInt(process.env.SYNC_MAX_RETRIES || '3', 10),
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '10', 10),
  },

  // Feature Flags
  features: {
    wearablesEnabled: process.env.FEATURE_WEARABLES_ENABLED !== 'false',
    aiRecommendationsEnabled: process.env.FEATURE_AI_RECOMMENDATIONS_ENABLED !== 'false',
    burnoutPredictionEnabled: process.env.FEATURE_BURNOUT_PREDICTION_ENABLED !== 'false',
  },
});


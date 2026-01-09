/**
 * Training Service Configuration
 *
 * Environment variables for database, Kafka, service auth, LMS, and gamification.
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'training-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || process.env.PORT || '4024', 10),
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'training_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(',').map(s => s.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || 'training-service',
    groupId: process.env.KAFKA_GROUP_ID || 'training-service-group',
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

  // LMS Integration
  lms: {
    baseUrl: process.env.LMS_BASE_URL || '',
    apiEnabled: (process.env.LMS_API_ENABLED || 'false').toLowerCase() === 'true',
    apiKey: process.env.LMS_API_KEY || '',
    branchIds: (process.env.LMS_BRANCH_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
  },

  // Redis/Cache Configuration
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Gamification Settings
  gamification: {
    dailyLoginPoints: parseInt(process.env.GAMIFICATION_DAILY_LOGIN_POINTS || '10', 10),
    courseCompletionMultiplier: parseFloat(process.env.GAMIFICATION_COURSE_MULTIPLIER || '1.0'),
    leaderboardCacheSeconds: parseInt(process.env.GAMIFICATION_LEADERBOARD_CACHE || '60', 10),
  },
});



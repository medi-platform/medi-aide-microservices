/**
 * Mentorship Service Configuration
 *
 * Environment variables for database, Kafka, service auth, and mentorship settings.
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'mentorship-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || process.env.PORT || '4035', 10),
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'mentorship_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(',').map(s => s.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || 'mentorship-service',
    groupId: process.env.KAFKA_GROUP_ID || 'mentorship-service-group',
    ssl: process.env.KAFKA_SSL === 'true',
  },

  // Service Auth Configuration
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,caregiver-service,user-service')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  },

  // Redis/Cache Configuration
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Mentorship Settings
  mentorship: {
    matchExpirationHours: parseInt(process.env.MENTORSHIP_MATCH_EXPIRATION_HOURS || '24', 10),
    maxMatchesPerRequest: parseInt(process.env.MENTORSHIP_MAX_MATCHES || '10', 10),
    sessionDefaultDurationMinutes: parseInt(process.env.MENTORSHIP_SESSION_DURATION || '60', 10),
    minMentorExperienceYears: parseInt(process.env.MENTORSHIP_MIN_MENTOR_EXPERIENCE || '2', 10),
  },

  // AI/ML Service Integration (for matching)
  ai: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://stage3-ai-ml-service:5000',
    matchingEndpoint: '/api/v1/mentorship/match',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
  },

  // Feature Flags
  features: {
    aiMatchingEnabled: process.env.FEATURE_AI_MATCHING_ENABLED !== 'false',
    autoSchedulingEnabled: process.env.FEATURE_AUTO_SCHEDULING_ENABLED !== 'false',
  },
});


/**
 * Care Network Service Configuration
 *
 * Environment variables for database, Kafka, service auth, and community settings.
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'care-network-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || process.env.PORT || '4033', 10),
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'care_network_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(',').map(s => s.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || 'care-network-service',
    groupId: process.env.KAFKA_GROUP_ID || 'care-network-service-group',
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

  // Redis/Cache Configuration
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Community Group Settings
  groups: {
    maxMembersPerGroup: parseInt(process.env.GROUPS_MAX_MEMBERS || '500', 10),
    defaultPageSize: parseInt(process.env.GROUPS_PAGE_SIZE || '25', 10),
    allowPrivateGroups: process.env.GROUPS_ALLOW_PRIVATE !== 'false',
  },

  // CoffeeMeet Settings
  coffeeMeets: {
    defaultDurationMinutes: parseInt(process.env.COFFEEMEET_DEFAULT_DURATION || '30', 10),
    maxParticipants: parseInt(process.env.COFFEEMEET_MAX_PARTICIPANTS || '12', 10),
    minParticipants: parseInt(process.env.COFFEEMEET_MIN_PARTICIPANTS || '2', 10),
    autoCleanupHours: parseInt(process.env.COFFEEMEET_CLEANUP_HOURS || '24', 10),
  },

  // Moderation Settings
  moderation: {
    enabled: process.env.MODERATION_ENABLED !== 'false',
    serviceUrl: process.env.MODERATION_SERVICE_URL || 'http://stage3-moderation-service:4025',
  },

  // Video Meeting Providers
  meetingProviders: {
    defaultProvider: process.env.MEETING_DEFAULT_PROVIDER || 'custom',
    zoomApiKey: process.env.ZOOM_API_KEY || '',
    zoomApiSecret: process.env.ZOOM_API_SECRET || '',
    googleMeetEnabled: process.env.GOOGLE_MEET_ENABLED === 'true',
  },

  // Feature Flags
  features: {
    coffeeMeetsEnabled: process.env.FEATURE_COFFEEMEETS_ENABLED !== 'false',
    groupChatEnabled: process.env.FEATURE_GROUP_CHAT_ENABLED !== 'false',
    presenceEnabled: process.env.FEATURE_PRESENCE_ENABLED !== 'false',
  },
});


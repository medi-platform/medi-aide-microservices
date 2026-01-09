/**
 * User Service Configuration
 *
 * Environment variables for database, Kafka, service auth, and identity verification.
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'user-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || process.env.PORT || '4012', 10),
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'user_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(',').map(s => s.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
    groupId: process.env.KAFKA_GROUP_ID || 'user-service-group',
    ssl: process.env.KAFKA_SSL === 'true',
  },

  // Service Auth Configuration
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'auth-service,care-request-service,notification-service')
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

  // Identity Verification Settings
  identityVerification: {
    expirationYears: parseInt(process.env.IDENTITY_EXPIRATION_YEARS || '2', 10),
    autoApprovalEnabled: process.env.IDENTITY_AUTO_APPROVAL_ENABLED === 'true',
    ocrServiceUrl: process.env.OCR_SERVICE_URL || '',
    backgroundCheckServiceUrl: process.env.BACKGROUND_CHECK_SERVICE_URL || '',
  },

  // File Storage Integration
  fileStorage: {
    serviceUrl: process.env.FILE_SERVICE_URL || 'http://stage3-file-service:4026',
    bucketName: process.env.FILE_BUCKET_NAME || 'user-documents',
  },

  // Feature Flags
  features: {
    identityVerificationEnabled: process.env.FEATURE_IDENTITY_VERIFICATION_ENABLED !== 'false',
    backgroundCheckEnabled: process.env.FEATURE_BACKGROUND_CHECK_ENABLED !== 'false',
    ocrEnabled: process.env.FEATURE_OCR_ENABLED !== 'false',
  },
});


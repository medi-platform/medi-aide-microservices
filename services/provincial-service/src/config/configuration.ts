/**
 * Provincial Service Configuration
 * Enterprise-grade configuration for Canadian provincial regulations
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'provincial-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4034', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'provincial_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttlSeconds: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  dataResidency: {
    enabled: (process.env.DATA_RESIDENCY_ENABLED || 'true').toLowerCase() === 'true',
    primaryRegion: process.env.PRIMARY_DATA_REGION || 'ca-central-1',
    backupRegion: process.env.BACKUP_DATA_REGION || 'ca-west-1',
    enforceCanadianDataStorage: (process.env.ENFORCE_CA_DATA_STORAGE || 'true').toLowerCase() === 'true',
  },
  bilingual: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,fr').split(','),
    enforceQuebecFrench: (process.env.ENFORCE_QUEBEC_FRENCH || 'true').toLowerCase() === 'true',
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,agency-service,caregiver-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});


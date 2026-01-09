/**
 * Feature Flags Service Configuration
 * Enterprise-grade configuration for feature flag management
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'feature-flags-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4042', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'feature_flags_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttlSeconds: parseInt(process.env.REDIS_TTL || '60', 10),
  },
  evaluation: {
    cacheEnabled: (process.env.FLAG_CACHE_ENABLED || 'true').toLowerCase() === 'true',
    cacheTtlSeconds: parseInt(process.env.FLAG_CACHE_TTL || '60', 10),
    defaultValue: (process.env.FLAG_DEFAULT_VALUE || 'false').toLowerCase() === 'true',
  },
  analytics: {
    enabled: (process.env.FLAG_ANALYTICS_ENABLED || 'true').toLowerCase() === 'true',
    samplingRate: parseFloat(process.env.FLAG_ANALYTICS_SAMPLING || '1.0'),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,all-services')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});


/**
 * EVV (Electronic Visit Verification) Service Configuration
 * Enterprise-grade configuration for visit verification and GPS compliance
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'evv-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4009', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'evv_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttlSeconds: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'evv-service',
    groupId: process.env.KAFKA_GROUP_ID || 'evv-group',
    topics: {
      evvEvents: process.env.KAFKA_TOPIC_EVV_EVENTS || 'evv.events',
      visitVerifications: process.env.KAFKA_TOPIC_VISIT_VERIFICATIONS || 'evv.verifications',
      complianceAlerts: process.env.KAFKA_TOPIC_COMPLIANCE_ALERTS || 'evv.compliance.alerts',
    },
  },
  gps: {
    maxDistanceMeters: parseInt(process.env.GPS_MAX_DISTANCE_METERS || '200', 10),
    accuracyThresholdMeters: parseInt(process.env.GPS_ACCURACY_THRESHOLD || '50', 10),
    staleLocationSeconds: parseInt(process.env.GPS_STALE_LOCATION_SECONDS || '300', 10),
    geocodingApiKey: process.env.GEOCODING_API_KEY || '',
    geocodingProvider: process.env.GEOCODING_PROVIDER || 'google',
  },
  verification: {
    methods: (process.env.EVV_VERIFICATION_METHODS || 'gps,telephony,biometric,fob').split(','),
    requirePhoto: (process.env.EVV_REQUIRE_PHOTO || 'false').toLowerCase() === 'true',
    requireSignature: (process.env.EVV_REQUIRE_SIGNATURE || 'true').toLowerCase() === 'true',
    gracePeriodMinutes: parseInt(process.env.EVV_GRACE_PERIOD_MINUTES || '15', 10),
    allowManualOverride: (process.env.EVV_ALLOW_MANUAL_OVERRIDE || 'true').toLowerCase() === 'true',
  },
  compliance: {
    state21stCenturyCuresEnabled: (process.env.CURES_ACT_ENABLED || 'true').toLowerCase() === 'true',
    aggregatorIntegrationEnabled: (process.env.AGGREGATOR_ENABLED || 'false').toLowerCase() === 'true',
    aggregatorUrl: process.env.AGGREGATOR_URL || '',
    aggregatorApiKey: process.env.AGGREGATOR_API_KEY || '',
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555', 10), // 7 years
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,visit-service,scheduling-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});

/**
 * Visit Service Configuration
 * Enterprise-grade configuration for visit management
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'visit-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4006', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'visit_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'visit-service',
    groupId: process.env.KAFKA_GROUP_ID || 'visit-group',
    topics: {
      visitEvents: process.env.KAFKA_TOPIC_VISIT_EVENTS || 'visit.events',
      visitStatusChanges: process.env.KAFKA_TOPIC_VISIT_STATUS || 'visit.status.changes',
    },
  },
  visit: {
    maxDurationHours: parseInt(process.env.VISIT_MAX_DURATION_HOURS || '24', 10),
    autoCompleteAfterHours: parseInt(process.env.VISIT_AUTO_COMPLETE_HOURS || '8', 10),
    reminderBeforeMinutes: parseInt(process.env.VISIT_REMINDER_MINUTES || '30', 10),
    allowReschedule: (process.env.VISIT_ALLOW_RESCHEDULE || 'true').toLowerCase() === 'true',
    rescheduleNoticeHours: parseInt(process.env.VISIT_RESCHEDULE_NOTICE_HOURS || '24', 10),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,scheduling-service,evv-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});

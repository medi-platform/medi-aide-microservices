/**
 * Residential Service Configuration
 * Centralized configuration management for residential care facility service
 */

export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'residential-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4060', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'residential_db',
    schema: process.env.DB_SCHEMA || 'public',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'residential-service',
    groupId: process.env.KAFKA_GROUP_ID || 'residential-service-group',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  serviceAuth: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    serviceId: process.env.SERVICE_ID || 'residential-service',
  },
  notifications: {
    guardianNotificationEnabled: process.env.GUARDIAN_NOTIFICATIONS_ENABLED !== 'false',
    escalationTimeoutMinutes: parseInt(process.env.ESCALATION_TIMEOUT_MINUTES || '30', 10),
    seriousOccurrenceAutoReportEnabled: process.env.SERIOUS_OCCURRENCE_AUTO_REPORT === 'true',
  },
  staffing: {
    minimumCoverageRatio: parseFloat(process.env.MIN_COVERAGE_RATIO || '1.0'),
    alertThresholdHours: parseInt(process.env.ALERT_THRESHOLD_HOURS || '24', 10),
    overtimeAlertEnabled: process.env.OVERTIME_ALERT_ENABLED !== 'false',
  },
});

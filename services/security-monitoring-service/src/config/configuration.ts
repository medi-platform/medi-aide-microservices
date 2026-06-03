/**
 * Security Monitoring Service Configuration
 * Enterprise-grade configuration for security event monitoring and threat detection
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'security-monitoring-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4041', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'security_monitoring_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'security-monitoring-service',
    groupId: process.env.KAFKA_GROUP_ID || 'security-monitoring-group',
    topics: {
      securityEvents: process.env.KAFKA_TOPIC_SECURITY_EVENTS || 'security.events',
      auditLogs: process.env.KAFKA_TOPIC_AUDIT_LOGS || 'audit.logs',
      threatAlerts: process.env.KAFKA_TOPIC_THREAT_ALERTS || 'threat.alerts',
    },
  },
  alerting: {
    enabled: (process.env.ALERTING_ENABLED || 'true').toLowerCase() === 'true',
    webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
    slackWebhook: process.env.SLACK_WEBHOOK_URL || '',
    pagerDutyKey: process.env.PAGERDUTY_SERVICE_KEY || '',
    emailRecipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  },
  anomalyDetection: {
    enabled: (process.env.ANOMALY_DETECTION_ENABLED || 'true').toLowerCase() === 'true',
    baselineWindowDays: parseInt(process.env.ANOMALY_BASELINE_DAYS || '30', 10),
    sensitivityLevel: parseFloat(process.env.ANOMALY_SENSITIVITY || '2.5'),
    minDataPoints: parseInt(process.env.ANOMALY_MIN_DATAPOINTS || '100', 10),
  },
  retention: {
    auditLogsDays: parseInt(process.env.AUDIT_LOGS_RETENTION_DAYS || '365', 10),
    securityEventsDays: parseInt(process.env.SECURITY_EVENTS_RETENTION_DAYS || '90', 10),
    alertsDays: parseInt(process.env.ALERTS_RETENTION_DAYS || '180', 10),
  },
  rateLimit: {
    maxEventsPerSecond: parseInt(process.env.MAX_EVENTS_PER_SECOND || '1000', 10),
    burstSize: parseInt(process.env.BURST_SIZE || '5000', 10),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,audit-service,auth-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});


/**
 * Fraud Detection Service Configuration
 * Enterprise-grade configuration for fraud detection and prevention
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'fraud-detection-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4040', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'fraud_detection_db',
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
    clientId: process.env.KAFKA_CLIENT_ID || 'fraud-detection-service',
    groupId: process.env.KAFKA_GROUP_ID || 'fraud-detection-group',
    topics: {
      fraudEvents: process.env.KAFKA_TOPIC_FRAUD_EVENTS || 'fraud.events',
      fraudAlerts: process.env.KAFKA_TOPIC_FRAUD_ALERTS || 'fraud.alerts',
      transactionEvents: process.env.KAFKA_TOPIC_TRANSACTIONS || 'transactions.events',
    },
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://stage3-ai-ml-service:5000',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
    modelEndpoints: {
      fraudScoring: process.env.FRAUD_MODEL_ENDPOINT || '/api/v1/fraud/score',
      anomalyDetection: process.env.ANOMALY_MODEL_ENDPOINT || '/api/v1/fraud/anomaly',
      identityVerification: process.env.IDENTITY_MODEL_ENDPOINT || '/api/v1/fraud/identity',
    },
    timeout: parseInt(process.env.AI_TIMEOUT_MS || '5000', 10),
  },
  scoring: {
    thresholds: {
      low: parseFloat(process.env.FRAUD_THRESHOLD_LOW || '0.3'),
      medium: parseFloat(process.env.FRAUD_THRESHOLD_MEDIUM || '0.6'),
      high: parseFloat(process.env.FRAUD_THRESHOLD_HIGH || '0.8'),
      critical: parseFloat(process.env.FRAUD_THRESHOLD_CRITICAL || '0.95'),
    },
    weights: {
      velocityCheck: parseFloat(process.env.WEIGHT_VELOCITY || '0.25'),
      deviceFingerprint: parseFloat(process.env.WEIGHT_DEVICE || '0.2'),
      geolocation: parseFloat(process.env.WEIGHT_GEO || '0.15'),
      behaviorPattern: parseFloat(process.env.WEIGHT_BEHAVIOR || '0.2'),
      identityMatch: parseFloat(process.env.WEIGHT_IDENTITY || '0.2'),
    },
  },
  ruleEngine: {
    maxRulesPerEvaluation: parseInt(process.env.MAX_RULES_PER_EVAL || '100', 10),
    ruleTimeout: parseInt(process.env.RULE_TIMEOUT_MS || '500', 10),
    enableMLScoring: (process.env.ENABLE_ML_SCORING || 'true').toLowerCase() === 'true',
  },
  alerting: {
    enabled: (process.env.ALERTING_ENABLED || 'true').toLowerCase() === 'true',
    webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
    slackChannel: process.env.ALERT_SLACK_CHANNEL || '',
    emailRecipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,payment-service,user-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});


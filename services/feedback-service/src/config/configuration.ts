/**
 * Feedback Service Configuration
 * Enterprise-grade configuration for surveys and ratings
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'feedback-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4019', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'feedback_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'feedback-service',
    groupId: process.env.KAFKA_GROUP_ID || 'feedback-group',
    topics: {
      feedbackEvents: process.env.KAFKA_TOPIC_FEEDBACK_EVENTS || 'feedback.events',
      surveyResponses: process.env.KAFKA_TOPIC_SURVEY_RESPONSES || 'feedback.surveys',
    },
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,visit-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});

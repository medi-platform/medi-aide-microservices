/**
 * Communication Service Configuration
 * Enterprise-grade configuration for real-time messaging
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'communication-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4018', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'communication_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'communication-service',
    groupId: process.env.KAFKA_GROUP_ID || 'communication-group',
    topics: {
      messages: process.env.KAFKA_TOPIC_MESSAGES || 'communication.messages',
      presence: process.env.KAFKA_TOPIC_PRESENCE || 'communication.presence',
    },
  },
  websocket: {
    path: process.env.WS_PATH || '/ws',
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '10000', 10),
  },
  messaging: {
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '5000', 10),
    maxAttachments: parseInt(process.env.MAX_ATTACHMENTS || '10', 10),
    messageRetentionDays: parseInt(process.env.MESSAGE_RETENTION_DAYS || '365', 10),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,notification-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});

/**
 * Reports Service Configuration
 * Phase 5H: Reports Service
 */
export default () => ({
  port: parseInt(process.env.SERVICE_PORT || '4070', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'reports_db',
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'reports-service',
    groupId: 'reports-service-group',
  },
  storage: {
    bucket: process.env.REPORTS_BUCKET || 'medi-aide-reports',
    endpoint: process.env.S3_ENDPOINT || '',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
  },
  auth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,analytics-service').split(','),
  },
});

export default () => ({
  port: parseInt(process.env.PORT || '4010', 10),
  
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_DATABASE || 'notification_db',
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@stage3-rabbitmq:5672',
    queues: {
      notifications: 'notifications_queue',
      email: 'email_queue',
      sms: 'sms_queue',
      push: 'push_queue',
    },
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    apiKey: process.env.EMAIL_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@medi-aide.com',
  },
  
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.SMS_FROM,
  },
  
  push: {
    provider: process.env.PUSH_PROVIDER || 'firebase',
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  
  consul: {
    host: process.env.CONSUL_HOST || 'stage3-consul',
    port: parseInt(process.env.CONSUL_PORT || '8500', 10),
  },
  
  tracing: {
    enabled: process.env.ENABLE_TRACING !== 'false',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://stage3-jaeger:14268/api/traces',
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  retry: {
    maxAttempts: 3,
    backoffDelay: 1000,
    backoffMultiplier: 2,
  },
});

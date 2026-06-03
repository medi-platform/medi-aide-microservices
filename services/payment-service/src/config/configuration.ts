/**
 * Payment Service Configuration
 * Enterprise-grade configuration for payment processing
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'payment-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4012', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'payment_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
    groupId: process.env.KAFKA_GROUP_ID || 'payment-group',
    topics: {
      paymentEvents: process.env.KAFKA_TOPIC_PAYMENT_EVENTS || 'payment.events',
      refundEvents: process.env.KAFKA_TOPIC_REFUND_EVENTS || 'payment.refunds',
    },
  },
  fees: {
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5'),
    processingFeePercent: parseFloat(process.env.PROCESSING_FEE_PERCENT || '2.9'),
    fixedFee: parseFloat(process.env.FIXED_FEE || '0.30'),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,billing-service,agency-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';

export interface SwaggerServiceConfig {
  /** Service name (e.g., 'agency-service') */
  serviceName: string;
  /** API title */
  title: string;
  /** API description */
  description: string;
  /** API version */
  version?: string;
  /** API tags */
  tags?: Array<{ name: string; description: string }>;
  /** Contact info */
  contact?: {
    name: string;
    email: string;
    url?: string;
  };
  /** External docs */
  externalDocs?: {
    description: string;
    url: string;
  };
  /** Enable in production */
  enableInProduction?: boolean;
}

/**
 * Configure Swagger for a NestJS service
 */
export function setupSwagger(
  app: INestApplication,
  config: SwaggerServiceConfig,
): OpenAPIObject {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd && !config.enableInProduction) {
    return {} as OpenAPIObject;
  }

  const builder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(buildDescription(config))
    .setVersion(config.version || '1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'API-Key',
    )
    .addServer(
      process.env.API_BASE_URL || `http://localhost:${process.env.SERVICE_PORT || 4000}`,
      'Current Server',
    );

  // Add tags
  if (config.tags) {
    config.tags.forEach((tag) => builder.addTag(tag.name, tag.description));
  }

  // Add default tags
  builder
    .addTag('health', 'Health check endpoints')
    .addTag('default', 'General endpoints');

  // Add contact
  if (config.contact) {
    builder.setContact(config.contact.name, config.contact.url || '', config.contact.email);
  }

  // Add license
  builder.setLicense('Proprietary', 'https://medi-aide.com/terms');

  // Add external docs
  if (config.externalDocs) {
    builder.setExternalDoc(config.externalDocs.description, config.externalDocs.url);
  }

  const document = SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (controllerKey: string, methodKey: string) => 
      `${controllerKey}_${methodKey}`,
  });

  // Custom Swagger UI options
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: `${config.title} - API Docs`,
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 20px }
      .swagger-ui .info .title { font-size: 28px }
    `,
  });

  // Also serve JSON spec
  SwaggerModule.setup('docs/json', app, document, {
    jsonDocumentUrl: '/docs/openapi.json',
  });

  return document;
}

/**
 * Build enhanced description with markdown
 */
function buildDescription(config: SwaggerServiceConfig): string {
  return `
${config.description}

## Authentication

This API uses JWT Bearer authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

- Standard: 100 requests per minute
- Authenticated: 500 requests per minute

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## HIPAA Compliance

This API handles Protected Health Information (PHI). All access is logged for HIPAA compliance.
Include the \`X-Access-Reason\` header when accessing patient data.

## Support

For API support, contact: api-support@medi-aide.com
`;
}

/**
 * Service-specific Swagger configurations
 */
export const SERVICE_CONFIGS: Record<string, SwaggerServiceConfig> = {
  'agency-service': {
    serviceName: 'agency-service',
    title: 'Agency Service API',
    description: 'Enterprise B2B Agency Management - Manage home care agencies, staff, billing, and compliance.',
    tags: [
      { name: 'agencies', description: 'Agency management operations' },
      { name: 'staff', description: 'Staff and employee management' },
      { name: 'billing', description: 'Billing and invoicing' },
      { name: 'compliance', description: 'Compliance and certifications' },
      { name: 'job-postings', description: 'Job posting management' },
    ],
  },
  'caregiver-service': {
    serviceName: 'caregiver-service',
    title: 'Caregiver Service API',
    description: 'Professional Caregiver Management - Profiles, availability, certifications, and performance.',
    tags: [
      { name: 'caregivers', description: 'Caregiver profile management' },
      { name: 'availability', description: 'Availability and scheduling' },
      { name: 'certifications', description: 'Certifications and training' },
      { name: 'documents', description: 'Document management' },
      { name: 'performance', description: 'Performance tracking' },
    ],
  },
  'patient-service': {
    serviceName: 'patient-service',
    title: 'Patient Service API',
    description: 'Patient/Client Management - Demographics, care plans, clinical notes, and medical records.',
    tags: [
      { name: 'patients', description: 'Patient profile management' },
      { name: 'care-plans', description: 'Care plan management' },
      { name: 'clinical-notes', description: 'Clinical documentation' },
      { name: 'medications', description: 'Medication management' },
      { name: 'vitals', description: 'Vital signs tracking' },
    ],
  },
  'scheduling-service': {
    serviceName: 'scheduling-service',
    title: 'Scheduling Service API',
    description: 'Schedule and Shift Management - Appointments, shifts, recurring schedules, and availability.',
    tags: [
      { name: 'schedules', description: 'Schedule management' },
      { name: 'shifts', description: 'Shift management' },
      { name: 'availability', description: 'Availability checking' },
      { name: 'recurring', description: 'Recurring schedules' },
    ],
  },
  'residential-service': {
    serviceName: 'residential-service',
    title: 'Residential Service API',
    description: 'Residential Facility Management - Residences, rooms, residents, and facility operations.',
    tags: [
      { name: 'residences', description: 'Residence management' },
      { name: 'rooms', description: 'Room management' },
      { name: 'residents', description: 'Resident management' },
      { name: 'shifts', description: 'Facility shifts' },
      { name: 'meals', description: 'Meal planning' },
    ],
  },
  'communication-service': {
    serviceName: 'communication-service',
    title: 'Communication Service API',
    description: 'Communication Management - Messages, notifications, announcements, and templates.',
    tags: [
      { name: 'messages', description: 'Messaging' },
      { name: 'notifications', description: 'Push notifications' },
      { name: 'announcements', description: 'Announcements' },
      { name: 'templates', description: 'Message templates' },
    ],
  },
  'feedback-service': {
    serviceName: 'feedback-service',
    title: 'Feedback Service API',
    description: 'Feedback and Reviews - Surveys, ratings, reviews, and feedback analytics.',
    tags: [
      { name: 'surveys', description: 'Survey management' },
      { name: 'ratings', description: 'Rating submissions' },
      { name: 'reviews', description: 'Reviews' },
      { name: 'analytics', description: 'Feedback analytics' },
    ],
  },
  'reports-service': {
    serviceName: 'reports-service',
    title: 'Reports Service API',
    description: 'Reporting and Analytics - Report generation, dashboards, and data exports.',
    tags: [
      { name: 'reports', description: 'Report generation' },
      { name: 'templates', description: 'Report templates' },
      { name: 'exports', description: 'Data exports' },
      { name: 'scheduled', description: 'Scheduled reports' },
    ],
  },
  'auth-service': {
    serviceName: 'auth-service',
    title: 'Authentication Service API',
    description: 'Authentication and Authorization - Login, tokens, MFA, and session management.',
    tags: [
      { name: 'auth', description: 'Authentication' },
      { name: 'tokens', description: 'Token management' },
      { name: 'mfa', description: 'Multi-factor authentication' },
      { name: 'sessions', description: 'Session management' },
    ],
  },
  'audit-service': {
    serviceName: 'audit-service',
    title: 'Audit Service API',
    description: 'Audit Logging and Compliance - Activity logs, compliance records, and HIPAA reporting.',
    tags: [
      { name: 'audit-logs', description: 'Audit logging' },
      { name: 'compliance', description: 'Compliance records' },
      { name: 'reports', description: 'Compliance reports' },
    ],
  },
};

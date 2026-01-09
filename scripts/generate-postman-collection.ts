/**
 * Postman Collection Generator
 * Generates a Postman collection from OpenAPI specs
 * 
 * Usage: npx ts-node scripts/generate-postman-collection.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  variable: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  auth: {
    type: string;
    bearer: Array<{ key: string; value: string; type: string }>;
  };
  item: PostmanFolder[];
}

interface PostmanFolder {
  name: string;
  description?: string;
  item: PostmanRequest[];
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string; type: string }>;
    body?: {
      mode: string;
      raw: string;
      options?: { raw: { language: string } };
    };
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string; disabled?: boolean }>;
    };
  };
  response: any[];
}

const SERVICES = [
  { name: 'Agency Service', port: 4050, prefix: 'agency' },
  { name: 'Caregiver Service', port: 4051, prefix: 'caregiver' },
  { name: 'Patient Service', port: 4052, prefix: 'patient' },
  { name: 'Scheduling Service', port: 4054, prefix: 'scheduling' },
  { name: 'Residential Service', port: 4060, prefix: 'residential' },
  { name: 'Communication Service', port: 4061, prefix: 'communication' },
  { name: 'Feedback Service', port: 4062, prefix: 'feedback' },
  { name: 'Reports Service', port: 4063, prefix: 'reports' },
  { name: 'Auth Service', port: 4001, prefix: 'auth' },
];

function generateCollection(): PostmanCollection {
  const collection: PostmanCollection = {
    info: {
      name: 'Medi-Aide API',
      description: 'Complete API collection for Medi-Aide Healthcare Platform',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:8000', type: 'string' },
      { key: 'accessToken', value: '', type: 'string' },
    ],
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
    },
    item: [],
  };

  // Add Authentication folder
  collection.item.push(createAuthFolder());

  // Add service folders
  SERVICES.forEach((service) => {
    collection.item.push(createServiceFolder(service));
  });

  return collection;
}

function createAuthFolder(): PostmanFolder {
  return {
    name: 'Authentication',
    description: 'Authentication and authorization endpoints',
    item: [
      {
        name: 'Login',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                email: 'admin@medi-aide.com',
                password: 'SecureP@ss123',
              },
              null,
              2,
            ),
            options: { raw: { language: 'json' } },
          },
          url: {
            raw: '{{baseUrl}}/api/v1/auth/login',
            host: ['{{baseUrl}}'],
            path: ['api', 'v1', 'auth', 'login'],
          },
        },
        response: [],
      },
      {
        name: 'Refresh Token',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify({ refreshToken: '{{refreshToken}}' }, null, 2),
            options: { raw: { language: 'json' } },
          },
          url: {
            raw: '{{baseUrl}}/api/v1/auth/refresh',
            host: ['{{baseUrl}}'],
            path: ['api', 'v1', 'auth', 'refresh'],
          },
        },
        response: [],
      },
      {
        name: 'Get Current User',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/api/v1/auth/me',
            host: ['{{baseUrl}}'],
            path: ['api', 'v1', 'auth', 'me'],
          },
        },
        response: [],
      },
      {
        name: 'Logout',
        request: {
          method: 'POST',
          header: [],
          url: {
            raw: '{{baseUrl}}/api/v1/auth/logout',
            host: ['{{baseUrl}}'],
            path: ['api', 'v1', 'auth', 'logout'],
          },
        },
        response: [],
      },
    ],
  };
}

function createServiceFolder(service: { name: string; port: number; prefix: string }): PostmanFolder {
  const resourceName = service.prefix + 's';
  const basePath = ['api', 'v1', resourceName];

  return {
    name: service.name,
    description: `${service.name} API endpoints`,
    item: [
      // List
      {
        name: `List ${service.name}`,
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: `{{baseUrl}}/${basePath.join('/')}`,
            host: ['{{baseUrl}}'],
            path: basePath,
            query: [
              { key: 'page', value: '1', disabled: false },
              { key: 'limit', value: '20', disabled: false },
              { key: 'search', value: '', disabled: true },
              { key: 'sortBy', value: 'createdAt', disabled: true },
              { key: 'sortOrder', value: 'desc', disabled: true },
            ],
          },
        },
        response: [],
      },
      // Get by ID
      {
        name: `Get ${service.prefix} by ID`,
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: `{{baseUrl}}/${basePath.join('/')}/:id`,
            host: ['{{baseUrl}}'],
            path: [...basePath, ':id'],
          },
        },
        response: [],
      },
      // Create
      {
        name: `Create ${service.prefix}`,
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify(getExampleBody(service.prefix), null, 2),
            options: { raw: { language: 'json' } },
          },
          url: {
            raw: `{{baseUrl}}/${basePath.join('/')}`,
            host: ['{{baseUrl}}'],
            path: basePath,
          },
        },
        response: [],
      },
      // Update
      {
        name: `Update ${service.prefix}`,
        request: {
          method: 'PUT',
          header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify(getExampleBody(service.prefix), null, 2),
            options: { raw: { language: 'json' } },
          },
          url: {
            raw: `{{baseUrl}}/${basePath.join('/')}/:id`,
            host: ['{{baseUrl}}'],
            path: [...basePath, ':id'],
          },
        },
        response: [],
      },
      // Delete
      {
        name: `Delete ${service.prefix}`,
        request: {
          method: 'DELETE',
          header: [],
          url: {
            raw: `{{baseUrl}}/${basePath.join('/')}/:id`,
            host: ['{{baseUrl}}'],
            path: [...basePath, ':id'],
          },
        },
        response: [],
      },
      // Health
      {
        name: `${service.name} Health`,
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: `http://localhost:${service.port}/health`,
            host: [`localhost:${service.port}`],
            path: ['health'],
          },
        },
        response: [],
      },
    ],
  };
}

function getExampleBody(prefix: string): Record<string, any> {
  const examples: Record<string, any> = {
    agency: {
      name: 'Premium Care Services',
      email: 'contact@premiumcare.com',
      phone: '+1-555-123-4567',
      address: {
        street: '123 Main Street',
        city: 'Toronto',
        province: 'Ontario',
        postalCode: 'M5V 1A1',
        country: 'Canada',
      },
      status: 'active',
    },
    caregiver: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '+1-555-234-5678',
      skills: ['personal_care', 'medication_assistance'],
      languages: ['en', 'fr'],
    },
    patient: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1950-05-15',
      gender: 'male',
      email: 'john.doe@email.com',
      phone: '+1-555-345-6789',
    },
    scheduling: {
      patientId: '{{patientId}}',
      caregiverId: '{{caregiverId}}',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      services: ['personal_care', 'meal_prep'],
    },
    residential: {
      name: 'Sunrise Senior Living',
      type: 'assisted_living',
      capacity: 50,
      address: {
        street: '456 Care Lane',
        city: 'Toronto',
        province: 'Ontario',
        postalCode: 'M5V 2B2',
        country: 'Canada',
      },
    },
    communication: {
      recipientId: '{{recipientId}}',
      subject: 'Schedule Update',
      message: 'Your shift has been updated.',
      type: 'notification',
    },
    feedback: {
      entityType: 'caregiver',
      entityId: '{{caregiverId}}',
      rating: 5,
      comment: 'Excellent care and professionalism.',
    },
    reports: {
      type: 'shift_summary',
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      format: 'pdf',
    },
    auth: {
      email: 'admin@medi-aide.com',
      password: 'SecureP@ss123',
    },
  };

  return examples[prefix] || { name: 'Example' };
}

// Generate and save
const collection = generateCollection();
const outputPath = path.join(__dirname, '..', 'docs', 'postman', 'Medi-Aide-API.postman_collection.json');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`✅ Postman collection generated: ${outputPath}`);

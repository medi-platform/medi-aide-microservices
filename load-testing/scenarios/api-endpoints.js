/**
 * API Endpoints Test
 * Tests all major API endpoints for performance and reliability
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { getEnvironment } from '../config/environments.js';
import { authenticate, apiRequest, thinkTime, testData } from '../lib/helpers.js';

// Per-endpoint metrics
const endpointMetrics = {
  agencies: new Trend('endpoint_agencies'),
  caregivers: new Trend('endpoint_caregivers'),
  patients: new Trend('endpoint_patients'),
  schedules: new Trend('endpoint_schedules'),
  shifts: new Trend('endpoint_shifts'),
  vitals: new Trend('endpoint_vitals'),
  notes: new Trend('endpoint_notes'),
  notifications: new Trend('endpoint_notifications'),
  reports: new Trend('endpoint_reports'),
};

const endpointErrors = new Counter('endpoint_errors');

export const options = {
  vus: 20,
  duration: '10m',
  thresholds: {
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.05'],
    'endpoint_agencies': ['p(95)<500'],
    'endpoint_caregivers': ['p(95)<500'],
    'endpoint_patients': ['p(95)<500'],
    'endpoint_schedules': ['p(95)<1000'],
    'endpoint_shifts': ['p(95)<500'],
    'endpoint_vitals': ['p(95)<500'],
    'endpoint_notes': ['p(95)<500'],
    'endpoint_notifications': ['p(95)<300'],
    'endpoint_reports': ['p(95)<3000'],
  },
};

const env = getEnvironment();

const testCredentials = {
  email: 'apitest@medi-aide.com',
  password: 'ApiTest123!',
};

export function setup() {
  const token = authenticate(env.apiGateway, testCredentials);
  return { token, baseUrl: env.apiGateway };
}

export default function(data) {
  const { token, baseUrl } = data;

  if (!token) return;

  // Agency endpoints
  group('Agency Endpoints', () => {
    testEndpoint('GET', `${baseUrl}/api/v1/agencies/current`, null, token, 'agencies', endpointMetrics.agencies);
    thinkTime(0.5, 1);
  });

  // Caregiver endpoints
  group('Caregiver Endpoints', () => {
    // List
    testEndpoint('GET', `${baseUrl}/api/v1/caregivers?page=1&limit=20`, null, token, 'caregivers', endpointMetrics.caregivers);
    
    // Search
    testEndpoint('GET', `${baseUrl}/api/v1/caregivers?search=John`, null, token, 'caregivers', endpointMetrics.caregivers);
    
    // Filter
    testEndpoint('GET', `${baseUrl}/api/v1/caregivers?status=active&skills=PSW`, null, token, 'caregivers', endpointMetrics.caregivers);
    
    thinkTime(0.5, 1);
  });

  // Patient endpoints
  group('Patient Endpoints', () => {
    testEndpoint('GET', `${baseUrl}/api/v1/patients?page=1&limit=20`, null, token, 'patients', endpointMetrics.patients);
    testEndpoint('GET', `${baseUrl}/api/v1/patients?careLevel=high`, null, token, 'patients', endpointMetrics.patients);
    thinkTime(0.5, 1);
  });

  // Schedule endpoints
  group('Schedule Endpoints', () => {
    const today = new Date().toISOString().split('T')[0];
    testEndpoint('GET', `${baseUrl}/api/v1/schedules?startDate=${today}&days=7`, null, token, 'schedules', endpointMetrics.schedules);
    testEndpoint('GET', `${baseUrl}/api/v1/schedules/today`, null, token, 'schedules', endpointMetrics.schedules);
    thinkTime(0.5, 1);
  });

  // Shift endpoints
  group('Shift Endpoints', () => {
    testEndpoint('GET', `${baseUrl}/api/v1/shifts?limit=20`, null, token, 'shifts', endpointMetrics.shifts);
    testEndpoint('GET', `${baseUrl}/api/v1/shifts?status=pending`, null, token, 'shifts', endpointMetrics.shifts);
    
    // Create shift (occasional)
    if (Math.random() < 0.1) {
      const shiftData = {
        patientId: 'test-patient-1',
        caregiverId: 'test-caregiver-1',
        date: testData.randomDate(7),
        startTime: '09:00',
        endTime: '17:00',
      };
      testEndpoint('POST', `${baseUrl}/api/v1/shifts`, shiftData, token, 'shifts', endpointMetrics.shifts);
    }
    
    thinkTime(0.5, 1);
  });

  // Vitals endpoints
  group('Vitals Endpoints', () => {
    testEndpoint('GET', `${baseUrl}/api/v1/patients/test-patient-1/vitals?limit=20`, null, token, 'vitals', endpointMetrics.vitals);
    
    // Record vital (occasional)
    if (Math.random() < 0.2) {
      const vitalData = {
        patientId: 'test-patient-1',
        type: 'blood_pressure',
        systolic: 110 + Math.floor(Math.random() * 30),
        diastolic: 70 + Math.floor(Math.random() * 20),
        recordedAt: new Date().toISOString(),
      };
      testEndpoint('POST', `${baseUrl}/api/v1/vitals`, vitalData, token, 'vitals', endpointMetrics.vitals);
    }
    
    thinkTime(0.5, 1);
  });

  // Notes endpoints
  group('Notes Endpoints', () => {
    testEndpoint('GET', `${baseUrl}/api/v1/patients/test-patient-1/notes?limit=10`, null, token, 'notes', endpointMetrics.notes);
    
    // Create note (occasional)
    if (Math.random() < 0.15) {
      const noteData = {
        patientId: 'test-patient-1',
        content: `API test note ${Date.now()}`,
        type: 'general',
      };
      testEndpoint('POST', `${baseUrl}/api/v1/notes`, noteData, token, 'notes', endpointMetrics.notes);
    }
    
    thinkTime(0.5, 1);
  });

  // Notification endpoints
  group('Notification Endpoints', () => {
    testEndpoint('GET', `${baseUrl}/api/v1/notifications?unread=true`, null, token, 'notifications', endpointMetrics.notifications);
    testEndpoint('GET', `${baseUrl}/api/v1/notifications?limit=20`, null, token, 'notifications', endpointMetrics.notifications);
    thinkTime(0.5, 1);
  });

  // Report endpoints (less frequent, slower)
  if (Math.random() < 0.1) {
    group('Report Endpoints', () => {
      testEndpoint('GET', `${baseUrl}/api/v1/reports/summary?period=week`, null, token, 'reports', endpointMetrics.reports);
      thinkTime(1, 2);
    });
  }
}

function testEndpoint(method, url, body, token, name, metric) {
  const response = apiRequest(method, url, body, token, { name });
  
  metric.add(response.timings.duration);

  const success = check(response, {
    [`${name} status OK`]: (r) => r.status === 200 || r.status === 201,
    [`${name} response time OK`]: (r) => r.timings.duration < 3000,
  });

  if (!success) {
    endpointErrors.add(1);
  }

  return response;
}

export function handleSummary(data) {
  const endpointSummary = {};
  
  Object.keys(endpointMetrics).forEach(endpoint => {
    const metric = data.metrics[`endpoint_${endpoint}`];
    if (metric) {
      endpointSummary[endpoint] = {
        avg: metric.values?.avg,
        p95: metric.values?.['p(95)'],
        p99: metric.values?.['p(99)'],
        min: metric.values?.min,
        max: metric.values?.max,
      };
    }
  });

  return {
    'reports/api-endpoints-summary.json': JSON.stringify({
      testType: 'API Endpoints Test',
      timestamp: new Date().toISOString(),
      endpoints: endpointSummary,
      overall: {
        totalRequests: data.metrics.http_reqs?.values?.count,
        errorRate: data.metrics.http_req_failed?.values?.rate,
        endpointErrors: data.metrics.endpoint_errors?.values?.count,
      },
    }, null, 2),
  };
}

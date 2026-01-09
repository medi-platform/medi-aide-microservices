/**
 * Load Test
 * Simulates normal and peak load conditions
 * Tests system behavior under expected traffic
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getEnvironment } from '../config/environments.js';
import { k6Thresholds, vuConfigurations } from '../config/thresholds.js';
import { 
  authenticate, 
  apiRequest, 
  thinkTime,
  checkResponse,
  successfulLogins,
  shiftsCreated,
} from '../lib/helpers.js';

export const options = {
  stages: vuConfigurations.load.stages,
  thresholds: k6Thresholds,
};

const env = getEnvironment();

// Test users (pre-created in staging)
const testUsers = [
  { email: 'loadtest-admin@medi-aide.com', password: 'LoadTest123!' },
  { email: 'loadtest-manager@medi-aide.com', password: 'LoadTest123!' },
  { email: 'loadtest-caregiver@medi-aide.com', password: 'LoadTest123!' },
];

export function setup() {
  // Login and get tokens for each user type
  const tokens = {};
  
  testUsers.forEach((user, index) => {
    const token = authenticate(env.apiGateway, user);
    if (token) {
      tokens[`user${index}`] = token;
    }
  });

  return { tokens, baseUrl: env.apiGateway };
}

export default function(data) {
  const { tokens, baseUrl } = data;
  const userIndex = __VU % Object.keys(tokens).length;
  const token = tokens[`user${userIndex}`];

  if (!token) {
    console.error('No valid token available');
    return;
  }

  // Simulate typical user journey
  group('Dashboard Load', () => {
    // Get dashboard data
    const dashboardResponse = apiRequest('GET', `${baseUrl}/api/v1/dashboard`, null, token, {
      name: 'dashboard',
    });

    checkResponse(dashboardResponse, {
      'Dashboard loads': (r) => r.status === 200,
      'Dashboard has data': (r) => r.body && r.body.length > 0,
    }, 'dashboard');

    thinkTime(2, 4);
  });

  group('Caregiver List', () => {
    const response = apiRequest('GET', `${baseUrl}/api/v1/caregivers?page=1&limit=20`, null, token, {
      name: 'list-caregivers',
    });

    checkResponse(response, {
      'Caregivers list loads': (r) => r.status === 200,
    }, 'caregivers');

    thinkTime(1, 2);
  });

  group('Patient List', () => {
    const response = apiRequest('GET', `${baseUrl}/api/v1/patients?page=1&limit=20`, null, token, {
      name: 'list-patients',
    });

    checkResponse(response, {
      'Patients list loads': (r) => r.status === 200,
    }, 'patients');

    thinkTime(1, 2);
  });

  group('Schedule View', () => {
    const today = new Date().toISOString().split('T')[0];
    const response = apiRequest(
      'GET', 
      `${baseUrl}/api/v1/schedules?startDate=${today}&days=7`, 
      null, 
      token,
      { name: 'schedule-view' }
    );

    checkResponse(response, {
      'Schedule loads': (r) => r.status === 200,
    }, 'schedule');

    thinkTime(2, 4);
  });

  group('Shift Details', () => {
    // Get a shift and view details
    const shiftsResponse = apiRequest('GET', `${baseUrl}/api/v1/shifts?limit=5`, null, token, {
      name: 'list-shifts',
    });

    if (shiftsResponse.status === 200) {
      try {
        const shifts = JSON.parse(shiftsResponse.body);
        if (shifts.data && shifts.data.length > 0) {
          const shiftId = shifts.data[0].id;
          const detailResponse = apiRequest('GET', `${baseUrl}/api/v1/shifts/${shiftId}`, null, token, {
            name: 'shift-detail',
          });

          checkResponse(detailResponse, {
            'Shift detail loads': (r) => r.status === 200,
          }, 'shift-detail');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    thinkTime(1, 3);
  });

  group('Notifications', () => {
    const response = apiRequest('GET', `${baseUrl}/api/v1/notifications?unread=true`, null, token, {
      name: 'notifications',
    });

    checkResponse(response, {
      'Notifications load': (r) => r.status === 200,
    }, 'notifications');

    thinkTime(1, 2);
  });

  // Random action (simulate varied user behavior)
  if (Math.random() < 0.2) {
    group('Create Shift', () => {
      const shiftData = {
        patientId: 'test-patient-1',
        caregiverId: 'test-caregiver-1',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
      };

      const response = apiRequest('POST', `${baseUrl}/api/v1/shifts`, shiftData, token, {
        name: 'create-shift',
        critical: 'true',
      });

      if (checkResponse(response, {
        'Shift created': (r) => r.status === 201 || r.status === 200,
      }, 'create-shift')) {
        shiftsCreated.add(1);
      }

      thinkTime(2, 4);
    });
  }
}

export function teardown(data) {
  console.log('Load test completed');
}

export function handleSummary(data) {
  return {
    'reports/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Basic text summary
  return JSON.stringify({
    metrics: {
      http_reqs: data.metrics.http_reqs?.values?.count,
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'],
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate,
    },
  }, null, 2);
}

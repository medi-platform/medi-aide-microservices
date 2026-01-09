/**
 * Helper functions for load testing
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const successfulLogins = new Counter('successful_logins');
export const failedLogins = new Counter('failed_logins');
export const shiftsCreated = new Counter('shifts_created');
export const clockInSuccess = new Rate('clock_in_success');
export const apiLatency = new Trend('api_latency');
export const dbQueryTime = new Trend('db_query_time');

/**
 * Authenticate and get JWT token
 */
export function authenticate(baseUrl, credentials) {
  const response = http.post(
    `${baseUrl}/api/v1/auth/login`,
    JSON.stringify(credentials),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth' },
    }
  );

  const success = check(response, {
    'login successful': (r) => r.status === 200 || r.status === 201,
    'has access token': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulLogins.add(1);
    return JSON.parse(response.body).accessToken;
  } else {
    failedLogins.add(1);
    return null;
  }
}

/**
 * Make authenticated API request
 */
export function apiRequest(method, url, body, token, tags = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const options = {
    headers,
    tags: { endpoint: 'api', ...tags },
  };

  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, options);
      break;
    case 'POST':
      response = http.post(url, JSON.stringify(body), options);
      break;
    case 'PUT':
      response = http.put(url, JSON.stringify(body), options);
      break;
    case 'DELETE':
      response = http.del(url, null, options);
      break;
    case 'PATCH':
      response = http.patch(url, JSON.stringify(body), options);
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  apiLatency.add(response.timings.duration);
  return response;
}

/**
 * Random think time between actions
 */
export function thinkTime(min = 1, max = 3) {
  sleep(Math.random() * (max - min) + min);
}

/**
 * Generate random test data
 */
export const testData = {
  randomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
  randomPhone: () => `416${Math.floor(Math.random() * 9000000) + 1000000}`,
  randomName: () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    };
  },
  randomDate: (daysAhead = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
    return date.toISOString().split('T')[0];
  },
  randomTime: () => {
    const hours = Math.floor(Math.random() * 12) + 6; // 6 AM to 6 PM
    return `${hours.toString().padStart(2, '0')}:00`;
  },
};

/**
 * Check response and log details on failure
 */
export function checkResponse(response, checks, context = '') {
  const result = check(response, checks);
  
  if (!result) {
    console.error(`Check failed ${context}: Status ${response.status}, Body: ${response.body?.substring(0, 200)}`);
  }
  
  return result;
}

/**
 * Batch requests for efficiency
 */
export function batchRequests(requests, token) {
  const responses = http.batch(
    requests.map((req) => ({
      method: req.method || 'GET',
      url: req.url,
      body: req.body ? JSON.stringify(req.body) : null,
      params: {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        tags: req.tags || {},
      },
    }))
  );

  return responses;
}

/**
 * Generate test caregiver
 */
export function generateCaregiver() {
  const name = testData.randomName();
  return {
    firstName: name.firstName,
    lastName: name.lastName,
    email: testData.randomEmail(),
    phone: testData.randomPhone(),
    skills: ['Personal Care', 'Medication Administration'],
    certifications: ['PSW', 'CPR'],
    availability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
    ],
  };
}

/**
 * Generate test shift
 */
export function generateShift(caregiverId, patientId) {
  return {
    caregiverId,
    patientId,
    date: testData.randomDate(),
    startTime: '09:00',
    endTime: '17:00',
    type: 'regular',
    tasks: ['Personal Care', 'Meal Preparation', 'Medication Reminder'],
  };
}

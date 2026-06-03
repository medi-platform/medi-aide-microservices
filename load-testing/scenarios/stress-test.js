/**
 * Stress Test
 * Pushes system beyond normal capacity to find breaking points
 * Identifies performance degradation patterns
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { getEnvironment } from '../config/environments.js';
import { vuConfigurations } from '../config/thresholds.js';
import { authenticate, apiRequest, thinkTime } from '../lib/helpers.js';

// Custom metrics for stress testing
const errorRate = new Rate('error_rate');
const degradedResponses = new Counter('degraded_responses');
const criticalErrors = new Counter('critical_errors');
const responseTimeUnderLoad = new Trend('response_time_under_load');

export const options = {
  stages: vuConfigurations.stress.stages,
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.1'], // Allow up to 10% errors in stress test
    'error_rate': ['rate<0.15'],
    'critical_errors': ['count<50'],
  },
};

const env = getEnvironment();

const testCredentials = {
  email: 'stresstest@medi-aide.com',
  password: 'StressTest123!',
};

export function setup() {
  console.log('Starting stress test - pushing system to limits');
  const token = authenticate(env.apiGateway, testCredentials);
  return { token, baseUrl: env.apiGateway };
}

export default function(data) {
  const { token, baseUrl } = data;

  if (!token) {
    errorRate.add(1);
    return;
  }

  // High-frequency operations
  group('High-Frequency API Calls', () => {
    // Rapid API calls to simulate high load
    for (let i = 0; i < 5; i++) {
      const response = apiRequest('GET', `${baseUrl}/api/v1/caregivers?page=${i + 1}`, null, token, {
        name: 'stress-caregivers',
      });

      responseTimeUnderLoad.add(response.timings.duration);

      const success = check(response, {
        'Response received': (r) => r.status === 200 || r.status === 429,
      });

      if (!success) {
        errorRate.add(1);
        if (response.status >= 500) {
          criticalErrors.add(1);
        }
      } else {
        errorRate.add(0);
      }

      if (response.timings.duration > 2000) {
        degradedResponses.add(1);
      }

      // Minimal delay between requests
      sleep(0.1);
    }
  });

  group('Database-Heavy Operations', () => {
    // Search operations (typically DB-heavy)
    const searchTerms = ['John', 'Smith', 'caregiver', 'nurse', 'Toronto'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const searchResponse = apiRequest(
      'GET', 
      `${baseUrl}/api/v1/search?q=${term}&type=all`, 
      null, 
      token,
      { name: 'stress-search' }
    );

    responseTimeUnderLoad.add(searchResponse.timings.duration);
    
    if (searchResponse.status !== 200) {
      errorRate.add(1);
    }

    sleep(0.2);
  });

  group('Concurrent Write Operations', () => {
    // Simulate multiple write operations
    const actions = [
      {
        method: 'POST',
        url: `${baseUrl}/api/v1/notes`,
        body: {
          patientId: 'stress-patient-1',
          content: `Stress test note ${Date.now()}`,
          type: 'general',
        },
      },
      {
        method: 'POST',
        url: `${baseUrl}/api/v1/vitals`,
        body: {
          patientId: 'stress-patient-1',
          type: 'blood_pressure',
          systolic: 120,
          diastolic: 80,
        },
      },
    ];

    const action = actions[Math.floor(Math.random() * actions.length)];
    const response = apiRequest(action.method, action.url, action.body, token, {
      name: 'stress-write',
      critical: 'true',
    });

    responseTimeUnderLoad.add(response.timings.duration);

    if (response.status >= 500) {
      criticalErrors.add(1);
      errorRate.add(1);
    } else if (response.status >= 400) {
      errorRate.add(1);
    }

    sleep(0.3);
  });

  group('Complex Aggregations', () => {
    // Report generation (complex queries)
    const reportResponse = apiRequest(
      'GET',
      `${baseUrl}/api/v1/reports/summary?period=month`,
      null,
      token,
      { name: 'stress-report', endpoint: 'reports' }
    );

    responseTimeUnderLoad.add(reportResponse.timings.duration);

    if (reportResponse.timings.duration > 5000) {
      degradedResponses.add(1);
    }

    sleep(0.5);
  });

  // Minimal think time to maintain high load
  thinkTime(0.5, 1);
}

export function teardown(data) {
  console.log('Stress test completed - check for performance degradation patterns');
}

export function handleSummary(data) {
  const summary = {
    testType: 'Stress Test',
    timestamp: new Date().toISOString(),
    results: {
      totalRequests: data.metrics.http_reqs?.values?.count,
      p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)'],
      p99ResponseTime: data.metrics.http_req_duration?.values?.['p(99)'],
      errorRate: data.metrics.http_req_failed?.values?.rate,
      degradedResponses: data.metrics.degraded_responses?.values?.count,
      criticalErrors: data.metrics.critical_errors?.values?.count,
    },
    thresholdsPassed: !data.root_group?.checks?.some(c => c.fails > 0),
  };

  return {
    'reports/stress-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

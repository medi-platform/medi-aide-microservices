/**
 * Smoke Test
 * Quick sanity check that the system is working
 * Run before other tests to verify basic functionality
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getEnvironment, defaultHeaders } from '../config/environments.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
  },
};

const env = getEnvironment();

export default function() {
  group('Health Checks', () => {
    // API Gateway health
    const gatewayHealth = http.get(`${env.apiGateway}/health`, {
      headers: defaultHeaders,
      tags: { name: 'gateway-health' },
    });
    
    check(gatewayHealth, {
      'Gateway is healthy': (r) => r.status === 200,
    });

    sleep(1);
  });

  group('Public Endpoints', () => {
    // Check API is responding
    const apiCheck = http.get(`${env.apiGateway}/api/v1/health`, {
      headers: defaultHeaders,
      tags: { name: 'api-health' },
    });
    
    check(apiCheck, {
      'API responds': (r) => r.status === 200 || r.status === 401,
    });

    sleep(1);
  });

  group('Authentication Endpoint', () => {
    // Verify auth endpoint exists (expect 400 for missing body)
    const authCheck = http.post(
      `${env.apiGateway}/api/v1/auth/login`,
      JSON.stringify({}),
      {
        headers: defaultHeaders,
        tags: { name: 'auth-check' },
      }
    );
    
    check(authCheck, {
      'Auth endpoint responds': (r) => r.status === 400 || r.status === 401 || r.status === 422,
    });

    sleep(1);
  });

  group('Service Endpoints', () => {
    const services = [
      '/api/v1/agencies',
      '/api/v1/caregivers',
      '/api/v1/patients',
      '/api/v1/schedules',
    ];

    services.forEach((endpoint) => {
      const response = http.get(`${env.apiGateway}${endpoint}`, {
        headers: defaultHeaders,
        tags: { name: endpoint },
      });

      check(response, {
        [`${endpoint} responds`]: (r) => r.status === 200 || r.status === 401,
      });
    });

    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    'reports/smoke-test-summary.json': JSON.stringify(data, null, 2),
  };
}

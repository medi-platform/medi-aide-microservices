/**
 * Soak Test (Endurance Test)
 * Tests system stability over extended periods
 * Identifies memory leaks, resource exhaustion, performance degradation
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Counter, Trend, Gauge } from 'k6/metrics';
import { getEnvironment } from '../config/environments.js';
import { vuConfigurations } from '../config/thresholds.js';
import { authenticate, apiRequest, thinkTime } from '../lib/helpers.js';

// Metrics for soak testing
const hourlyResponseTime = new Trend('hourly_response_time');
const errorRateOverTime = new Rate('error_rate_over_time');
const memoryIndicator = new Gauge('memory_indicator');
const connectionErrors = new Counter('connection_errors');
const timeoutErrors = new Counter('timeout_errors');

export const options = {
  stages: vuConfigurations.soak.stages,
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.01'],
    'error_rate_over_time': ['rate<0.02'],
    'connection_errors': ['count<10'],
    'timeout_errors': ['count<20'],
  },
};

const env = getEnvironment();

const testCredentials = {
  email: 'soaktest@medi-aide.com',
  password: 'SoakTest123!',
};

// Track test phases (hourly)
let testStartTime;
let currentHour = 0;

export function setup() {
  console.log('Starting soak test - 4+ hour endurance test');
  testStartTime = Date.now();
  
  const token = authenticate(env.apiGateway, testCredentials);
  return { token, baseUrl: env.apiGateway };
}

export default function(data) {
  const { token, baseUrl } = data;
  
  if (!token) {
    connectionErrors.add(1);
    return;
  }

  // Update hour tracking
  const elapsedHours = Math.floor((Date.now() - testStartTime) / (60 * 60 * 1000));
  if (elapsedHours > currentHour) {
    currentHour = elapsedHours;
    console.log(`Entering hour ${currentHour + 1} of soak test`);
  }

  // Simulate realistic user behavior over extended period
  group('Normal Operations', () => {
    // Dashboard check (every user does this)
    const dashboardStart = Date.now();
    const dashboardResponse = apiRequest('GET', `${baseUrl}/api/v1/dashboard`, null, token, {
      name: 'soak-dashboard',
    });
    hourlyResponseTime.add(Date.now() - dashboardStart);

    const success = check(dashboardResponse, {
      'Dashboard loads': (r) => r.status === 200,
    });

    if (!success) {
      errorRateOverTime.add(1);
      if (dashboardResponse.status === 0) {
        connectionErrors.add(1);
      }
    } else {
      errorRateOverTime.add(0);
    }

    thinkTime(2, 5);
  });

  group('Data Retrieval', () => {
    // Rotate through different data types
    const iteration = __ITER;
    const endpoints = [
      '/api/v1/caregivers',
      '/api/v1/patients',
      '/api/v1/schedules',
      '/api/v1/shifts',
      '/api/v1/agencies/current',
    ];
    
    const endpoint = endpoints[iteration % endpoints.length];
    const response = apiRequest('GET', `${baseUrl}${endpoint}`, null, token, {
      name: `soak-${endpoint}`,
    });

    hourlyResponseTime.add(response.timings.duration);

    if (response.status !== 200) {
      errorRateOverTime.add(1);
    }

    thinkTime(3, 7);
  });

  // Periodic write operations (less frequent)
  if (__ITER % 10 === 0) {
    group('Write Operations', () => {
      const noteData = {
        patientId: 'soak-patient-1',
        content: `Soak test note - Hour ${currentHour + 1} - Iteration ${__ITER}`,
        type: 'general',
      };

      const response = apiRequest('POST', `${baseUrl}/api/v1/notes`, noteData, token, {
        name: 'soak-write',
      });

      hourlyResponseTime.add(response.timings.duration);

      if (response.status >= 400) {
        errorRateOverTime.add(1);
      }

      thinkTime(1, 2);
    });
  }

  // Health check (detect degradation)
  if (__ITER % 50 === 0) {
    group('Health Check', () => {
      const healthResponse = http.get(`${baseUrl}/health`, {
        timeout: '10s',
        tags: { name: 'soak-health' },
      });

      if (healthResponse.status === 200) {
        try {
          const health = JSON.parse(healthResponse.body);
          // Use response time as proxy for system health
          const healthScore = Math.max(0, 100 - (healthResponse.timings.duration / 10));
          memoryIndicator.add(healthScore);
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Check for timeout
      if (healthResponse.timings.duration > 9000) {
        timeoutErrors.add(1);
      }
    });
  }

  // Realistic think time (users don't constantly click)
  thinkTime(5, 15);
}

export function teardown(data) {
  console.log(`Soak test completed after ${currentHour + 1} hours`);
}

export function handleSummary(data) {
  const summary = {
    testType: 'Soak Test',
    timestamp: new Date().toISOString(),
    duration: {
      hours: currentHour + 1,
      totalMinutes: Math.floor((Date.now() - testStartTime) / 60000),
    },
    results: {
      totalRequests: data.metrics.http_reqs?.values?.count,
      avgResponseTime: data.metrics.http_req_duration?.values?.avg,
      p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)'],
      p99ResponseTime: data.metrics.http_req_duration?.values?.['p(99)'],
      errorRate: data.metrics.http_req_failed?.values?.rate,
      connectionErrors: data.metrics.connection_errors?.values?.count,
      timeoutErrors: data.metrics.timeout_errors?.values?.count,
    },
    stability: {
      healthScore: data.metrics.memory_indicator?.values?.value,
      errorRateOverTime: data.metrics.error_rate_over_time?.values?.rate,
    },
    analysis: {
      stable: isSystemStable(data),
      recommendations: generateRecommendations(data),
    },
  };

  return {
    'reports/soak-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

function isSystemStable(data) {
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const connectionErrors = data.metrics.connection_errors?.values?.count || 0;
  const timeoutErrors = data.metrics.timeout_errors?.values?.count || 0;

  return errorRate < 0.02 && connectionErrors < 10 && timeoutErrors < 20;
}

function generateRecommendations(data) {
  const recommendations = [];
  
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] || 0;
  if (p99 > 2000) {
    recommendations.push('Consider scaling up or optimizing database queries');
  }

  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  if (errorRate > 0.01) {
    recommendations.push('Investigate error sources - may indicate resource exhaustion');
  }

  const timeoutErrors = data.metrics.timeout_errors?.values?.count || 0;
  if (timeoutErrors > 10) {
    recommendations.push('Increase timeout thresholds or investigate slow operations');
  }

  if (recommendations.length === 0) {
    recommendations.push('System appears stable for extended operation');
  }

  return recommendations;
}

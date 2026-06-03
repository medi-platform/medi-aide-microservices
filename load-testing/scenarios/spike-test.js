/**
 * Spike Test
 * Tests system behavior during sudden traffic spikes
 * Simulates scenarios like shift change times or emergency situations
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { getEnvironment } from '../config/environments.js';
import { vuConfigurations } from '../config/thresholds.js';
import { authenticate, apiRequest, thinkTime } from '../lib/helpers.js';

// Custom metrics
const recoveryTime = new Trend('recovery_time');
const spikeErrors = new Counter('spike_errors');
const preSpikeDuration = new Trend('pre_spike_duration');
const duringSpikeDuration = new Trend('during_spike_duration');
const postSpikeDuration = new Trend('post_spike_duration');

export const options = {
  stages: vuConfigurations.spike.stages,
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.15'],
    'spike_errors': ['count<100'],
  },
};

const env = getEnvironment();

const testCredentials = {
  email: 'spiketest@medi-aide.com',
  password: 'SpikeTest123!',
};

let currentPhase = 'pre-spike';

export function setup() {
  console.log('Starting spike test - simulating sudden traffic surge');
  const token = authenticate(env.apiGateway, testCredentials);
  return { token, baseUrl: env.apiGateway, startTime: Date.now() };
}

export default function(data) {
  const { token, baseUrl, startTime } = data;
  
  if (!token) return;

  // Determine current phase based on VU count
  const vuCount = __VU;
  if (vuCount > 200) {
    currentPhase = 'during-spike';
  } else if (Date.now() - startTime > 120000) { // After 2 min
    currentPhase = 'post-spike';
  }

  group('Critical Path - Schedule View', () => {
    const start = Date.now();
    
    const response = apiRequest(
      'GET',
      `${baseUrl}/api/v1/schedules/today`,
      null,
      token,
      { name: 'spike-schedule', critical: 'true' }
    );

    const duration = Date.now() - start;

    // Track duration by phase
    switch (currentPhase) {
      case 'pre-spike':
        preSpikeDuration.add(duration);
        break;
      case 'during-spike':
        duringSpikeDuration.add(duration);
        break;
      case 'post-spike':
        postSpikeDuration.add(duration);
        break;
    }

    const success = check(response, {
      'Schedule available': (r) => r.status === 200,
      'Response time acceptable': (r) => r.timings.duration < 3000,
    });

    if (!success) {
      spikeErrors.add(1);
    }

    sleep(0.5);
  });

  group('EVV Clock-In Simulation', () => {
    // Simulate many caregivers clocking in at shift change
    const clockInData = {
      shiftId: `spike-shift-${__VU}`,
      timestamp: new Date().toISOString(),
      location: {
        latitude: 43.6532 + (Math.random() * 0.1),
        longitude: -79.3832 + (Math.random() * 0.1),
      },
    };

    const response = apiRequest(
      'POST',
      `${baseUrl}/api/v1/evv/clock-in`,
      clockInData,
      token,
      { name: 'spike-clock-in', critical: 'true' }
    );

    check(response, {
      'Clock-in processed': (r) => r.status === 200 || r.status === 201 || r.status === 404,
    });

    if (response.status >= 500) {
      spikeErrors.add(1);
    }

    sleep(0.3);
  });

  group('Dashboard Refresh', () => {
    const response = apiRequest(
      'GET',
      `${baseUrl}/api/v1/dashboard/summary`,
      null,
      token,
      { name: 'spike-dashboard' }
    );

    check(response, {
      'Dashboard loads': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  group('Notifications Push', () => {
    const response = apiRequest(
      'GET',
      `${baseUrl}/api/v1/notifications?limit=10`,
      null,
      token,
      { name: 'spike-notifications' }
    );

    check(response, {
      'Notifications available': (r) => r.status === 200,
    });

    sleep(0.2);
  });

  thinkTime(0.3, 0.7);
}

export function teardown(data) {
  console.log('Spike test completed - analyze recovery patterns');
}

export function handleSummary(data) {
  const summary = {
    testType: 'Spike Test',
    timestamp: new Date().toISOString(),
    phases: {
      preSpike: {
        avgDuration: data.metrics.pre_spike_duration?.values?.avg,
        p95Duration: data.metrics.pre_spike_duration?.values?.['p(95)'],
      },
      duringSpike: {
        avgDuration: data.metrics.during_spike_duration?.values?.avg,
        p95Duration: data.metrics.during_spike_duration?.values?.['p(95)'],
      },
      postSpike: {
        avgDuration: data.metrics.post_spike_duration?.values?.avg,
        p95Duration: data.metrics.post_spike_duration?.values?.['p(95)'],
      },
    },
    results: {
      totalRequests: data.metrics.http_reqs?.values?.count,
      spikeErrors: data.metrics.spike_errors?.values?.count,
      overallP95: data.metrics.http_req_duration?.values?.['p(95)'],
    },
    analysis: {
      performanceDegradation: calculateDegradation(data),
      recoveredSuccessfully: checkRecovery(data),
    },
  };

  return {
    'reports/spike-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

function calculateDegradation(data) {
  const preSpikeP95 = data.metrics.pre_spike_duration?.values?.['p(95)'] || 0;
  const duringSpikeP95 = data.metrics.during_spike_duration?.values?.['p(95)'] || 0;
  
  if (preSpikeP95 === 0) return 'N/A';
  
  const degradation = ((duringSpikeP95 - preSpikeP95) / preSpikeP95) * 100;
  return `${degradation.toFixed(1)}%`;
}

function checkRecovery(data) {
  const preSpikeP95 = data.metrics.pre_spike_duration?.values?.['p(95)'] || 0;
  const postSpikeP95 = data.metrics.post_spike_duration?.values?.['p(95)'] || 0;
  
  // Consider recovered if post-spike is within 20% of pre-spike
  return postSpikeP95 <= preSpikeP95 * 1.2;
}

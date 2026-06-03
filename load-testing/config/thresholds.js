/**
 * Performance thresholds for load testing
 * Based on SLA requirements and healthcare industry standards
 */

// Response time thresholds (in milliseconds)
export const responseTimeThresholds = {
  // API endpoints
  api: {
    p95: 500,   // 95th percentile should be under 500ms
    p99: 1000,  // 99th percentile should be under 1s
    max: 3000,  // Maximum should never exceed 3s
  },
  
  // Authentication endpoints (can be slower)
  auth: {
    p95: 1000,
    p99: 2000,
    max: 5000,
  },
  
  // Database-heavy operations
  reports: {
    p95: 2000,
    p99: 5000,
    max: 10000,
  },
  
  // Real-time operations (EVV, messaging)
  realtime: {
    p95: 200,
    p99: 500,
    max: 1000,
  },
};

// Error rate thresholds
export const errorRateThresholds = {
  api: 0.01,      // Less than 1% error rate
  auth: 0.005,    // Less than 0.5% for auth
  critical: 0.001, // Less than 0.1% for critical paths
};

// Throughput thresholds (requests per second)
export const throughputThresholds = {
  minimum: 100,    // Minimum RPS to handle
  target: 500,     // Target RPS for normal load
  peak: 1000,      // Peak RPS during high traffic
};

// K6 threshold configuration
export const k6Thresholds = {
  // HTTP request duration
  'http_req_duration': ['p(95)<500', 'p(99)<1000'],
  'http_req_duration{endpoint:auth}': ['p(95)<1000', 'p(99)<2000'],
  'http_req_duration{endpoint:api}': ['p(95)<500', 'p(99)<1000'],
  'http_req_duration{endpoint:reports}': ['p(95)<2000', 'p(99)<5000'],
  
  // HTTP request failed rate
  'http_req_failed': ['rate<0.01'],
  'http_req_failed{critical:true}': ['rate<0.001'],
  
  // HTTP request waiting (TTFB)
  'http_req_waiting': ['p(95)<400'],
  
  // Iterations
  'iteration_duration': ['p(95)<5000'],
  
  // Custom metrics
  'successful_logins': ['count>100'],
  'shifts_created': ['count>50'],
  'clock_in_success': ['rate>0.99'],
};

// Virtual user configurations
export const vuConfigurations = {
  smoke: {
    vus: 5,
    duration: '1m',
  },
  load: {
    stages: [
      { duration: '2m', target: 50 },   // Ramp up
      { duration: '5m', target: 50 },   // Stay at 50 VUs
      { duration: '2m', target: 100 },  // Ramp up more
      { duration: '5m', target: 100 },  // Stay at 100 VUs
      { duration: '2m', target: 0 },    // Ramp down
    ],
  },
  stress: {
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '5m', target: 300 },
      { duration: '2m', target: 400 },
      { duration: '5m', target: 400 },
      { duration: '10m', target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: '1m', target: 50 },
      { duration: '30s', target: 500 }, // Spike!
      { duration: '1m', target: 500 },
      { duration: '30s', target: 50 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  soak: {
    stages: [
      { duration: '5m', target: 100 },
      { duration: '4h', target: 100 },  // 4-hour soak
      { duration: '5m', target: 0 },
    ],
  },
};

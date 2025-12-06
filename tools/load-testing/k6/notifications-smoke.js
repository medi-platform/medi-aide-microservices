import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:4010';

export default function () {
  const res = http.get(`${BASE}/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has service field': (r) => JSON.parse(r.body).service !== undefined,
  });

  sleep(1);
}



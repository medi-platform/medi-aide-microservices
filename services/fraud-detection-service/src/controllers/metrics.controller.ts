import { Controller, Get, Header } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const fraudRequests = new Counter({
  name: 'fraud_requests_total',
  help: 'Total fraud detection API requests',
  labelNames: ['route', 'status'],
  registers: [registry],
});

export const fraudLatency = new Histogram({
  name: 'fraud_request_duration_seconds',
  help: 'Fraud detection API request duration in seconds',
  labelNames: ['route'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    return registry.metrics();
  }
}



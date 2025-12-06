import { Controller, Get, Header } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

// Custom metrics
export const notificationsSent = new Counter({
  name: 'notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['type'],
  registers: [registry],
});

export const notificationsFailed = new Counter({
  name: 'notifications_failed_total',
  help: 'Total notifications failed',
  labelNames: ['type'],
  registers: [registry],
});

export const notificationsRetried = new Counter({
  name: 'notifications_retried_total',
  help: 'Total notification retries',
  labelNames: ['type'],
  registers: [registry],
});

export const notificationDuration = new Histogram({
  name: 'notification_dispatch_duration_seconds',
  help: 'Notification dispatch duration in seconds',
  labelNames: ['type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

export const notificationQueueSize = new Gauge({
  name: 'notification_queue_size',
  help: 'Current size of notification queue',
  labelNames: ['status'],
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



import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between } from 'typeorm';

@Injectable()
export class MetricsAggregatorService {
  private readonly events: any[] = [];
  private readonly metrics: any[] = [];

  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyMetrics() {
    console.log('Running hourly metrics aggregation...');
    
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Aggregate different event types
    const aggregations = [
      { name: 'visits.count', eventType: 'visit.started', type: 'count' as const },
      { name: 'logins.count', eventType: 'user.login', type: 'count' as const },
      { name: 'payments.processed', eventType: 'payment.completed', type: 'count' as const }
    ];

    for (const agg of aggregations) {
      const count = this.events.filter((e) => e.eventType === agg.eventType && e.timestamp >= hourAgo && e.timestamp <= now).length;

      this.metrics.push({
        metricName: agg.name,
        aggregationType: agg.type,
        value: count,
        dimensions: { hourly: true },
        periodStart: hourAgo,
        periodEnd: now,
        createdAt: new Date(),
      });
    }

    console.log('Hourly metrics aggregation completed');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyMetrics() {
    console.log('Running daily metrics aggregation...');
    
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Calculate completion rates
    const startedVisits = this.events.filter((e) => e.eventType === 'visit.started' && e.timestamp >= dayAgo && e.timestamp <= now).length;

    const completedVisits = this.events.filter((e) => e.eventType === 'visit.completed' && e.timestamp >= dayAgo && e.timestamp <= now).length;

    const completionRate = startedVisits > 0 ? (completedVisits / startedVisits) * 100 : 0;

    this.metrics.push({
      metricName: 'visit.completion_rate',
      aggregationType: 'average',
      value: completionRate,
      dimensions: { daily: true },
      periodStart: dayAgo,
      periodEnd: now,
      createdAt: new Date(),
    });

    console.log('Daily metrics aggregation completed');
  }
}

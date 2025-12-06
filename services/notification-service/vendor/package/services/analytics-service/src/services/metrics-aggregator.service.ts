import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { AnalyticsMetric } from '../entities/analytics-metric.entity';

@Injectable()
export class MetricsAggregatorService {
  constructor(
    @InjectRepository(AnalyticsEvent) 
    private readonly eventRepo: Repository<AnalyticsEvent>,
    @InjectRepository(AnalyticsMetric) 
    private readonly metricRepo: Repository<AnalyticsMetric>
  ) {}

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
      const count = await this.eventRepo.count({
        where: {
          eventType: agg.eventType,
          timestamp: Between(hourAgo, now)
        }
      });

      await this.metricRepo.save({
        metricName: agg.name,
        aggregationType: agg.type,
        value: count,
        dimensions: { hourly: true },
        periodStart: hourAgo,
        periodEnd: now
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
    const startedVisits = await this.eventRepo.count({
      where: {
        eventType: 'visit.started',
        timestamp: Between(dayAgo, now)
      }
    });

    const completedVisits = await this.eventRepo.count({
      where: {
        eventType: 'visit.completed',
        timestamp: Between(dayAgo, now)
      }
    });

    const completionRate = startedVisits > 0 ? (completedVisits / startedVisits) * 100 : 0;

    await this.metricRepo.save({
      metricName: 'visit.completion_rate',
      aggregationType: 'average',
      value: completionRate,
      dimensions: { daily: true },
      periodStart: dayAgo,
      periodEnd: now
    });

    console.log('Daily metrics aggregation completed');
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { AnalyticsMetric } from '../entities/analytics-metric.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent) 
    private readonly eventRepo: Repository<AnalyticsEvent>,
    @InjectRepository(AnalyticsMetric) 
    private readonly metricRepo: Repository<AnalyticsMetric>
  ) {}

  async trackEvent(data: any) {
    const event = this.eventRepo.create({
      ...data,
      timestamp: data.timestamp || new Date()
    });
    return this.eventRepo.save(event);
  }

  async getMetrics(metricName: string, start: string, end: string) {
    return this.metricRepo.find({
      where: {
        metricName,
        periodStart: Between(new Date(start), new Date(end))
      },
      order: { periodStart: 'ASC' }
    });
  }

  async getDashboardSummary() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const [totalUsers, activeVisits, completionRate, avgResponseTime] = await Promise.all([
      this.eventRepo.count({
        where: { eventType: 'user.login', timestamp: Between(dayAgo, now) }
      }),
      this.eventRepo.count({
        where: { eventType: 'visit.started', timestamp: Between(dayAgo, now) }
      }),
      this.metricRepo.findOne({
        where: { metricName: 'visit.completion_rate' },
        order: { createdAt: 'DESC' }
      }),
      this.metricRepo.findOne({
        where: { metricName: 'api.response_time' },
        order: { createdAt: 'DESC' }
      })
    ]);

    return {
      summary: {
        totalUsers,
        activeVisits,
        completionRate: completionRate?.value || 0,
        avgResponseTime: avgResponseTime?.value || 0
      },
      period: { start: dayAgo, end: now }
    };
  }

  async generateUsageReport(period: string) {
    const now = new Date();
    let startDate: Date;
    
    switch(period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const events = await this.eventRepo.find({
      where: { timestamp: Between(startDate, now) },
      order: { timestamp: 'ASC' }
    });

    // Group events by type
    const eventsByType = events.reduce((acc: any, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    return {
      period: { start: startDate, end: now },
      totalEvents: events.length,
      eventsByType,
      topEvents: Object.entries(eventsByType)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 10)
        .map(([type, count]) => ({ type, count }))
    };
  }
}

import { Injectable } from '@nestjs/common';
// Dev-time in-memory analytics; replace with repositories in production
import { Between } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private readonly events: any[] = [];
  private readonly metrics: any[] = [];

  async trackEvent(data: any) {
    const event = { id: crypto.randomUUID(), ...data, timestamp: data.timestamp || new Date() };
    this.events.push(event);
    return event;
  }

  async getMetrics(metricName: string, start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return this.metrics
      .filter((m) => m.metricName === metricName && m.periodStart >= s && m.periodStart <= e)
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
  }

  async getDashboardSummary() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const totalUsers = this.events.filter((e) => e.eventType === 'user.login' && e.timestamp >= dayAgo).length;
    const activeVisits = this.events.filter((e) => e.eventType === 'visit.started' && e.timestamp >= dayAgo).length;
    const completionRate = this.metrics
      .filter((m) => m.metricName === 'visit.completion_rate')
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    const avgResponseTime = this.metrics
      .filter((m) => m.metricName === 'api.response_time')
      .sort((a, b) => b.createdAt - a.createdAt)[0];

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

    const events = this.events
      .filter((e) => e.timestamp >= startDate && e.timestamp <= now)
      .sort((a, b) => a.timestamp - b.timestamp);

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

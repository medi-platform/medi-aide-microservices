import { Injectable, Logger } from '@nestjs/common';
import { MatchingMetrics } from '../interfaces/matching.interfaces';

/**
 * Matching Metrics Service
 * 
 * Tracks and reports matching performance metrics
 * for SLA monitoring and optimization.
 */
@Injectable()
export class MatchingMetricsService {
  private readonly logger = new Logger(MatchingMetricsService.name);
  
  // In-memory metrics for real-time monitoring
  private readonly metrics: {
    totalRequests: number;
    successfulMatches: number;
    failedMatches: number;
    totalDuration: number;
    slaMet: number;
    slaViolations: number;
    lastHourMetrics: MatchingMetrics[];
  } = {
    totalRequests: 0,
    successfulMatches: 0,
    failedMatches: 0,
    totalDuration: 0,
    slaMet: 0,
    slaViolations: 0,
    lastHourMetrics: [],
  };
  
  private readonly SLA_TARGET_MS = parseInt(process.env.MATCHING_SLA_TARGET_MS || '3000', 10);
  private readonly METRICS_RETENTION_MS = 60 * 60 * 1000; // 1 hour
  
  /**
   * Record matching metrics
   */
  async recordMetrics(metrics: MatchingMetrics): Promise<void> {
    this.metrics.totalRequests++;
    this.metrics.totalDuration += metrics.duration;
    
    if ((metrics.matchCount ?? 0) > 0) {
      this.metrics.successfulMatches++;
    } else {
      this.metrics.failedMatches++;
    }
    
    // Track SLA compliance
    if (metrics.duration <= this.SLA_TARGET_MS) {
      this.metrics.slaMet++;
    } else {
      this.metrics.slaViolations++;
      this.logger.warn(`SLA violation: ${metrics.duration}ms > ${this.SLA_TARGET_MS}ms for ${metrics.careRequestId}`);
    }
    
    // Add to hourly metrics for trends
    this.metrics.lastHourMetrics.push(metrics);
    this.cleanupOldMetrics();
    
    // Log performance summary
    this.logger.log(`Matching metrics: ${metrics.duration}ms, ${metrics.matchCount} matches, SLA: ${metrics.duration <= this.SLA_TARGET_MS ? 'MET' : 'MISSED'}`);
  }
  
  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    totalRequests: number;
    successRate: number;
    avgDuration: number;
    slaComplianceRate: number;
    recentMetrics: MatchingMetrics[];
  } {
    const avgDuration = this.metrics.totalRequests > 0
      ? Math.round(this.metrics.totalDuration / this.metrics.totalRequests)
      : 0;
    
    const successRate = this.metrics.totalRequests > 0
      ? this.metrics.successfulMatches / this.metrics.totalRequests
      : 0;
    
    const slaComplianceRate = this.metrics.totalRequests > 0
      ? this.metrics.slaMet / this.metrics.totalRequests
      : 1;
    
    return {
      totalRequests: this.metrics.totalRequests,
      successRate,
      avgDuration,
      slaComplianceRate,
      recentMetrics: this.metrics.lastHourMetrics.slice(-10),
    };
  }
  
  /**
   * Get SLA status
   */
  getSLAStatus(): {
    currentCompliance: number;
    target: number;
    slaTargetMs: number;
    isHealthy: boolean;
    recentViolations: number;
  } {
    const recentMetrics = this.metrics.lastHourMetrics.filter(
      m => Date.now() - m.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );
    
    const recentCompliance = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.duration <= this.SLA_TARGET_MS).length / recentMetrics.length
      : 1;
    
    const recentViolations = recentMetrics.filter(m => m.duration > this.SLA_TARGET_MS).length;
    
    return {
      currentCompliance: recentCompliance,
      target: 0.95, // 95% SLA target
      slaTargetMs: this.SLA_TARGET_MS,
      isHealthy: recentCompliance >= 0.95,
      recentViolations,
    };
  }
  
  /**
   * Get aggregated metrics for time period
   */
  getAggregatedMetrics(periodMs: number = 3600000): {
    period: string;
    totalRequests: number;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    successRate: number;
    avgMatchCount: number;
    avgScore: number;
  } {
    const cutoff = Date.now() - periodMs;
    const recentMetrics = this.metrics.lastHourMetrics.filter(
      m => m.timestamp.getTime() >= cutoff
    );
    
    if (recentMetrics.length === 0) {
      return {
        period: this.formatPeriod(periodMs),
        totalRequests: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        successRate: 0,
        avgMatchCount: 0,
        avgScore: 0,
      };
    }
    
    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const matchCounts = recentMetrics.map(m => m.matchCount ?? 0);
    const scores = recentMetrics.filter(m => m.averageScore).map(m => m.averageScore!);
    
    return {
      period: this.formatPeriod(periodMs),
      totalRequests: recentMetrics.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p50Duration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99),
      successRate: recentMetrics.filter(m => (m.matchCount ?? 0) > 0).length / recentMetrics.length,
      avgMatchCount: Math.round(matchCounts.reduce((a, b) => a + b, 0) / matchCounts.length * 10) / 10,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }
  
  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  /**
   * Format period for display
   */
  private formatPeriod(ms: number): string {
    if (ms >= 3600000) return `${Math.round(ms / 3600000)}h`;
    if (ms >= 60000) return `${Math.round(ms / 60000)}m`;
    return `${ms}ms`;
  }
  
  /**
   * Cleanup old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.METRICS_RETENTION_MS;
    this.metrics.lastHourMetrics = this.metrics.lastHourMetrics.filter(
      m => m.timestamp.getTime() >= cutoff
    );
  }
  
  /**
   * Reset all metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics.totalRequests = 0;
    this.metrics.successfulMatches = 0;
    this.metrics.failedMatches = 0;
    this.metrics.totalDuration = 0;
    this.metrics.slaMet = 0;
    this.metrics.slaViolations = 0;
    this.metrics.lastHourMetrics = [];
  }
}
































































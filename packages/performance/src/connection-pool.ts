import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Connection Pool Configuration
 */
export interface PoolConfig {
  /** Minimum connections to maintain */
  min: number;
  /** Maximum connections allowed */
  max: number;
  /** Idle timeout in milliseconds */
  idleTimeoutMs: number;
  /** Connection timeout in milliseconds */
  connectionTimeoutMs: number;
  /** Acquire timeout in milliseconds */
  acquireTimeoutMs: number;
  /** Enable connection validation */
  validate: boolean;
}

/**
 * Default pool configuration
 */
export const DefaultPoolConfig: PoolConfig = {
  min: 5,
  max: 20,
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
  acquireTimeoutMs: 10000,
  validate: true,
};

/**
 * Pool Statistics
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  connectionErrors: number;
  avgAcquireTime: number;
}

/**
 * Connection Pool Manager
 * Provides optimized connection pool configuration for databases
 */
@Injectable()
export class ConnectionPoolManager implements OnModuleInit {
  private readonly logger = new Logger(ConnectionPoolManager.name);
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    connectionErrors: 0,
    avgAcquireTime: 0,
  };

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.logger.log('Connection pool manager initialized');
  }

  /**
   * Get optimized TypeORM pool configuration
   */
  getTypeOrmPoolConfig(): Partial<PoolConfig> {
    const env = this.configService.get('NODE_ENV', 'development');
    
    if (env === 'production') {
      return {
        min: parseInt(this.configService.get('DB_POOL_MIN', '10'), 10),
        max: parseInt(this.configService.get('DB_POOL_MAX', '50'), 10),
        idleTimeoutMs: 60000,
        connectionTimeoutMs: 5000,
        acquireTimeoutMs: 30000,
      };
    }

    return {
      min: 2,
      max: 10,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 5000,
      acquireTimeoutMs: 10000,
    };
  }

  /**
   * Get optimized Redis pool configuration
   */
  getRedisPoolConfig(): { maxRetriesPerRequest: number; maxConnections: number } {
    const env = this.configService.get('NODE_ENV', 'development');
    
    return {
      maxRetriesPerRequest: env === 'production' ? 5 : 3,
      maxConnections: env === 'production' ? 50 : 10,
    };
  }

  /**
   * Calculate optimal pool size based on workload
   */
  calculateOptimalPoolSize(
    avgQueriesPerSecond: number,
    avgQueryDurationMs: number,
  ): { min: number; max: number } {
    // Little's Law: L = λW
    // connections_needed = requests_per_second * avg_response_time_seconds
    const connectionsNeeded = avgQueriesPerSecond * (avgQueryDurationMs / 1000);
    
    // Add 50% buffer for peak loads
    const max = Math.ceil(connectionsNeeded * 1.5);
    const min = Math.ceil(connectionsNeeded * 0.5);

    return {
      min: Math.max(2, Math.min(min, 10)),
      max: Math.max(5, Math.min(max, 100)),
    };
  }

  /**
   * Update pool statistics
   */
  updateStats(update: Partial<PoolStats>): void {
    Object.assign(this.stats, update);
  }

  /**
   * Get current pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Health check for connection pool
   */
  isHealthy(): boolean {
    const utilizationRatio = this.stats.activeConnections / (this.stats.totalConnections || 1);
    const hasWaiting = this.stats.waitingRequests > 0;
    const highErrors = this.stats.connectionErrors > 10;

    if (utilizationRatio > 0.9 && hasWaiting) {
      this.logger.warn('Connection pool under stress');
      return false;
    }

    if (highErrors) {
      this.logger.warn('High connection error rate');
      return false;
    }

    return true;
  }

  /**
   * Get connection pool recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.stats;

    if (stats.activeConnections / (stats.totalConnections || 1) > 0.8) {
      recommendations.push('Consider increasing max pool size');
    }

    if (stats.idleConnections / (stats.totalConnections || 1) > 0.7) {
      recommendations.push('Consider decreasing min pool size to save resources');
    }

    if (stats.avgAcquireTime > 100) {
      recommendations.push('High acquire time detected - increase pool size or optimize queries');
    }

    if (stats.connectionErrors > 5) {
      recommendations.push('Connection errors detected - check database health');
    }

    return recommendations;
  }
}

/**
 * Database Connection Health Monitor
 */
@Injectable()
export class ConnectionHealthMonitor {
  private readonly logger = new Logger(ConnectionHealthMonitor.name);
  private healthHistory: { timestamp: number; healthy: boolean }[] = [];
  private readonly HISTORY_SIZE = 100;

  recordHealth(healthy: boolean): void {
    this.healthHistory.push({ timestamp: Date.now(), healthy });
    
    if (this.healthHistory.length > this.HISTORY_SIZE) {
      this.healthHistory.shift();
    }
  }

  getHealthPercentage(): number {
    if (this.healthHistory.length === 0) return 100;
    
    const healthy = this.healthHistory.filter((h) => h.healthy).length;
    return (healthy / this.healthHistory.length) * 100;
  }

  getLastError(): number | null {
    const lastUnhealthy = this.healthHistory
      .filter((h) => !h.healthy)
      .pop();
    
    return lastUnhealthy?.timestamp || null;
  }

  isStable(): boolean {
    // Check last 10 health checks
    const recent = this.healthHistory.slice(-10);
    return recent.every((h) => h.healthy);
  }
}

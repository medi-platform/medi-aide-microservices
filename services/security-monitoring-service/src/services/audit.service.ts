import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogEntry, AuditAction } from '../interfaces/security.interface';
import * as crypto from 'crypto';

/**
 * Audit Service
 * Manages immutable audit logs for compliance and security
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<AuditLog> {
    // Calculate changed fields if both states provided
    let changedFields: string[] = [];
    if (entry.previousState && entry.newState) {
      changedFields = this.calculateChangedFields(entry.previousState, entry.newState);
    }

    // Create the log entry
    const auditLog = this.auditRepo.create({
      userId: entry.userId,
      userEmail: entry.userEmail,
      userRole: entry.userRole,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      previousState: entry.previousState,
      newState: entry.newState,
      changedFields,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      outcome: entry.outcome,
      reason: entry.reason,
      metadata: entry.metadata,
    });

    // Calculate checksum for integrity
    auditLog.checksum = this.calculateChecksum(auditLog);

    const saved = await this.auditRepo.save(auditLog);
    this.logger.debug(`Audit log created: ${entry.action} on ${entry.resource}`);
    return saved;
  }

  /**
   * Log multiple entries in batch
   */
  async logBatch(entries: AuditLogEntry[]): Promise<number> {
    const auditLogs = entries.map((entry) => {
      const changedFields =
        entry.previousState && entry.newState
          ? this.calculateChangedFields(entry.previousState, entry.newState)
          : [];

      const log = this.auditRepo.create({
        userId: entry.userId,
        userEmail: entry.userEmail,
        userRole: entry.userRole,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        previousState: entry.previousState,
        newState: entry.newState,
        changedFields,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        outcome: entry.outcome,
        reason: entry.reason,
        metadata: entry.metadata,
      });

      log.checksum = this.calculateChecksum(log);
      return log;
    });

    const saved = await this.auditRepo.save(auditLogs);
    return saved.length;
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const qb = this.auditRepo.createQueryBuilder('log');

    if (filters.userId) {
      qb.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    if (filters.resource) {
      qb.andWhere('log.resource = :resource', { resource: filters.resource });
    }
    if (filters.resourceId) {
      qb.andWhere('log.resourceId = :resourceId', { resourceId: filters.resourceId });
    }
    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.startDate && filters.endDate) {
      qb.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [logs, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 100)
      .getManyAndCount();

    return { logs, total };
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(
    resource: string,
    resourceId: string,
  ): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { resource, resourceId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditLog[]> {
    const where: Record<string, unknown> = { userId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 1000,
    });
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(id: string): Promise<{ isValid: boolean; details: string }> {
    const log = await this.auditRepo.findOne({ where: { id } });
    if (!log) {
      return { isValid: false, details: 'Log entry not found' };
    }

    const expectedChecksum = this.calculateChecksum(log);
    const isValid = log.checksum === expectedChecksum;

    return {
      isValid,
      details: isValid
        ? 'Checksum verification passed'
        : 'Checksum mismatch - log may have been tampered',
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<{
    totalLogs: number;
    byAction: Record<AuditAction, number>;
    byResource: Array<{ resource: string; count: number }>;
    byUser: Array<{ userId: string; count: number }>;
    byOutcome: { success: number; failure: number };
  }> {
    const logs = await this.auditRepo.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const stats = {
      totalLogs: logs.length,
      byAction: {} as Record<AuditAction, number>,
      byResource: [] as Array<{ resource: string; count: number }>,
      byUser: [] as Array<{ userId: string; count: number }>,
      byOutcome: { success: 0, failure: 0 },
    };

    // By action
    for (const action of Object.values(AuditAction)) {
      stats.byAction[action] = logs.filter((l) => l.action === action).length;
    }

    // By resource
    const resourceCounts = new Map<string, number>();
    for (const log of logs) {
      resourceCounts.set(log.resource, (resourceCounts.get(log.resource) || 0) + 1);
    }
    stats.byResource = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // By user
    const userCounts = new Map<string, number>();
    for (const log of logs) {
      userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
    }
    stats.byUser = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // By outcome
    stats.byOutcome.success = logs.filter((l) => l.outcome === 'success').length;
    stats.byOutcome.failure = logs.filter((l) => l.outcome === 'failure').length;

    return stats;
  }

  /**
   * Calculate changed fields between two states
   */
  private calculateChangedFields(
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
  ): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(previousState), ...Object.keys(newState)]);

    for (const key of allKeys) {
      if (JSON.stringify(previousState[key]) !== JSON.stringify(newState[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Calculate checksum for integrity verification
   */
  private calculateChecksum(log: AuditLog): string {
    const data = JSON.stringify({
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      previousState: log.previousState,
      newState: log.newState,
      outcome: log.outcome,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportLogs(filters: {
    startDate: Date;
    endDate: Date;
    format?: 'json' | 'csv';
  }): Promise<{ data: string; filename: string }> {
    const logs = await this.auditRepo.find({
      where: { createdAt: Between(filters.startDate, filters.endDate) },
      order: { createdAt: 'ASC' },
    });

    const format = filters.format || 'json';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'csv') {
      const headers = [
        'id',
        'userId',
        'userEmail',
        'action',
        'resource',
        'resourceId',
        'outcome',
        'createdAt',
      ];
      const rows = logs.map((log) =>
        [
          log.id,
          log.userId,
          log.userEmail || '',
          log.action,
          log.resource,
          log.resourceId || '',
          log.outcome,
          log.createdAt.toISOString(),
        ].join(','),
      );
      return {
        data: [headers.join(','), ...rows].join('\n'),
        filename: `audit_logs_${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify(logs, null, 2),
      filename: `audit_logs_${timestamp}.json`,
    };
  }
}


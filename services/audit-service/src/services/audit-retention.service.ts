import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { AuditLog } from '../entities/audit-log-enhanced.entity';

@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);
  private readonly BATCH_SIZE = 1000;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  // Run daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processRetentionPolicies(): Promise<void> {
    this.logger.log('Starting audit log retention processing');
    
    try {
      const deletedCount = await this.deleteExpiredLogs();
      this.logger.log(`Deleted ${deletedCount} expired audit logs`);
      
      const archivedCount = await this.archiveOldLogs();
      this.logger.log(`Archived ${archivedCount} old audit logs`);
      
      const compressedCount = await this.compressLargeLogs();
      this.logger.log(`Compressed ${compressedCount} large audit logs`);
    } catch (error: any) {
      this.logger.error(`Retention processing failed: ${error.message}`, error.stack);
    }
  }

  private async deleteExpiredLogs(): Promise<number> {
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const expiredLogs = await this.auditLogRepo.find({
        where: {
          retentionUntil: LessThan(new Date()),
          flaggedForReview: false, // Don't delete flagged logs
        },
        take: this.BATCH_SIZE,
        select: ['id'],
      });

      if (expiredLogs.length === 0) {
        hasMore = false;
        break;
      }

      const ids = expiredLogs.map(log => log.id);
      const result = await this.auditLogRepo.delete(ids);
      totalDeleted += result.affected || 0;

      // Add small delay to avoid overwhelming the database
      await this.sleep(100);
    }

    return totalDeleted;
  }

  private async archiveOldLogs(): Promise<number> {
    // Archive logs older than 1 year but within retention period
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const logsToArchive = await this.auditLogRepo
      .createQueryBuilder('log')
      .where('log.created_at < :oneYearAgo', { oneYearAgo })
      .andWhere('log.retention_until > :now', { now: new Date() })
      .andWhere('log.metadata->>\'archived\' IS NULL')
      .limit(this.BATCH_SIZE)
      .getMany();

    for (const log of logsToArchive) {
      // In a real system, this would write to S3 or another archive storage
      log.metadata = {
        ...log.metadata,
        archived: true,
        archivedAt: new Date().toISOString(),
        originalSize: JSON.stringify(log).length,
      };

      // Compress metadata by removing redundant fields
      if (log.metadata.requestHeaders) {
        delete log.metadata.requestHeaders;
      }
      if (log.metadata.responseBody && JSON.stringify(log.metadata.responseBody).length > 1000) {
        log.metadata.responseBody = '[truncated]';
      }

      await this.auditLogRepo.save(log);
    }

    return logsToArchive.length;
  }

  private async compressLargeLogs(): Promise<number> {
    // Find logs with large metadata
    const largeLogs = await this.auditLogRepo
      .createQueryBuilder('log')
      .where('LENGTH(log.metadata::text) > :size', { size: 10000 })
      .andWhere('log.metadata->>\'compressed\' IS NULL')
      .limit(this.BATCH_SIZE)
      .getMany();

    for (const log of largeLogs) {
      const compressedMetadata = this.compressMetadata(log.metadata);
      log.metadata = compressedMetadata;
      await this.auditLogRepo.save(log);
    }

    return largeLogs.length;
  }

  private compressMetadata(metadata: Record<string, any>): Record<string, any> {
    const compressed: Record<string, any> = {
      compressed: true,
      compressedAt: new Date().toISOString(),
    };

    // Keep only essential fields
    const essentialFields = ['userId', 'action', 'result', 'error', 'duration'];
    
    for (const field of essentialFields) {
      if (metadata[field] !== undefined) {
        compressed[field] = metadata[field];
      }
    }

    // Summarize other fields
    compressed.fieldCount = Object.keys(metadata).length;
    compressed.originalSize = JSON.stringify(metadata).length;

    return compressed;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Emergency cleanup for disk space
  async emergencyCleanup(targetSizeGB: number): Promise<number> {
    this.logger.warn(`Emergency cleanup initiated, target size: ${targetSizeGB}GB`);

    const currentSizeResult = await this.auditLogRepo
      .createQueryBuilder('log')
      .select('SUM(LENGTH(log.metadata::text) + LENGTH(log.description))', 'totalSize')
      .getRawOne();

    const currentSizeGB = (currentSizeResult.totalSize || 0) / (1024 * 1024 * 1024);
    
    if (currentSizeGB <= targetSizeGB) {
      return 0;
    }

    // Delete oldest non-critical logs first
    const deleted = await this.auditLogRepo
      .createQueryBuilder()
      .delete()
      .where('severity IN (:...severities)', { severities: ['debug', 'info'] })
      .andWhere('phi_accessed = false')
      .andWhere('flagged_for_review = false')
      .orderBy('created_at', 'ASC')
      .limit(10000)
      .execute();

    return deleted.affected || 0;
  }
}

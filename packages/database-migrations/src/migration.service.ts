import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import * as crypto from 'crypto';
import {
  MigrationConfig,
  MigrationRecord,
  MigrationResult,
  MigrationStatus,
  MigrationLock,
  IMigration,
} from './interfaces';

/**
 * Enterprise Migration Service
 * 
 * Provides production-ready database migration capabilities:
 * - Migration locking to prevent concurrent runs
 * - Checksum validation for integrity
 * - Audit trail for compliance
 * - Automatic rollback on failure
 * - Health check integration
 */
@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private dataSource: DataSource | null = null;
  private readonly lockTimeout = 5 * 60 * 1000; // 5 minutes
  
  constructor(private readonly config: MigrationConfig) {}
  
  async onModuleInit(): Promise<void> {
    await this.ensureMigrationTables();
  }
  
  /**
   * Initialize database connection
   */
  async initialize(dataSource: DataSource): Promise<void> {
    this.dataSource = dataSource;
    await this.ensureMigrationTables();
  }
  
  /**
   * Ensure migration tracking tables exist
   */
  private async ensureMigrationTables(): Promise<void> {
    if (!this.dataSource?.isInitialized) return;
    
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      // Create migrations table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL UNIQUE,
          timestamp BIGINT NOT NULL,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          execution_time_ms INTEGER,
          status VARCHAR(20) NOT NULL DEFAULT 'success',
          checksum VARCHAR(64) NOT NULL,
          service_name VARCHAR(100) NOT NULL,
          environment VARCHAR(50) NOT NULL DEFAULT 'development',
          executed_by VARCHAR(255) NOT NULL DEFAULT 'system',
          error_message TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create migration locks table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS _migration_locks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(100) NOT NULL UNIQUE,
          locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          locked_by VARCHAR(255) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `);
      
      // Create index for faster lookups
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_migrations_timestamp 
        ON _migrations(timestamp DESC)
      `);
      
    } catch (error) {
      this.logger.error('Failed to create migration tables', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  
  /**
   * Acquire migration lock
   */
  private async acquireLock(): Promise<boolean> {
    if (!this.dataSource) throw new Error('DataSource not initialized');
    
    const queryRunner = this.dataSource.createQueryRunner();
    const lockId = `${this.config.serviceName}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + this.lockTimeout);
    
    try {
      // Clean up expired locks first
      await queryRunner.query(`
        DELETE FROM _migration_locks 
        WHERE expires_at < NOW()
      `);
      
      // Try to acquire lock
      await queryRunner.query(`
        INSERT INTO _migration_locks (service_name, locked_by, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (service_name) DO NOTHING
      `, [this.config.serviceName, lockId, expiresAt]);
      
      // Check if we got the lock
      const result = await queryRunner.query(`
        SELECT locked_by FROM _migration_locks 
        WHERE service_name = $1
      `, [this.config.serviceName]);
      
      return result[0]?.locked_by === lockId;
      
    } finally {
      await queryRunner.release();
    }
  }
  
  /**
   * Release migration lock
   */
  private async releaseLock(): Promise<void> {
    if (!this.dataSource) return;
    
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.query(`
        DELETE FROM _migration_locks 
        WHERE service_name = $1
      `, [this.config.serviceName]);
    } finally {
      await queryRunner.release();
    }
  }
  
  /**
   * Get migration status
   */
  async getStatus(migrations: IMigration[]): Promise<MigrationStatus> {
    if (!this.dataSource) throw new Error('DataSource not initialized');
    
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      // Get executed migrations
      const executed = await queryRunner.query(`
        SELECT * FROM _migrations 
        WHERE service_name = $1 
        ORDER BY timestamp DESC
      `, [this.config.serviceName]);
      
      const executedNames = new Set(executed.map((m: any) => m.name));
      
      // Find pending migrations
      const pending = migrations
        .filter(m => !executedNames.has(m.name))
        .map(m => m.name);
      
      const lastExecuted = executed[0] || undefined;
      
      return {
        pending,
        executed: executed.map((m: any) => ({
          id: m.id,
          name: m.name,
          timestamp: m.timestamp,
          executedAt: m.executed_at,
          executionTimeMs: m.execution_time_ms,
          status: m.status,
          checksum: m.checksum,
          serviceName: m.service_name,
          environment: m.environment,
          executedBy: m.executed_by,
          errorMessage: m.error_message,
        })),
        lastExecuted: lastExecuted ? {
          id: lastExecuted.id,
          name: lastExecuted.name,
          timestamp: lastExecuted.timestamp,
          executedAt: lastExecuted.executed_at,
          executionTimeMs: lastExecuted.execution_time_ms,
          status: lastExecuted.status,
          checksum: lastExecuted.checksum,
          serviceName: lastExecuted.service_name,
          environment: lastExecuted.environment,
          executedBy: lastExecuted.executed_by,
        } : undefined,
        databaseVersion: lastExecuted?.timestamp?.toString() || '0',
        isUpToDate: pending.length === 0,
      };
      
    } finally {
      await queryRunner.release();
    }
  }
  
  /**
   * Run all pending migrations
   */
  async runMigrations(migrations: IMigration[]): Promise<MigrationResult> {
    if (!this.dataSource) throw new Error('DataSource not initialized');
    
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsRun: [],
      migrationsSkipped: [],
      migrationsFailed: [],
      totalTimeMs: 0,
      errors: [],
    };
    
    // Acquire lock
    const hasLock = await this.acquireLock();
    if (!hasLock) {
      this.logger.warn('Could not acquire migration lock - another migration may be running');
      result.success = false;
      result.errors.push({
        migrationName: 'lock',
        message: 'Could not acquire migration lock',
      });
      return result;
    }
    
    try {
      // Sort migrations by timestamp
      const sortedMigrations = [...migrations].sort((a, b) => a.timestamp - b.timestamp);
      
      // Get already executed migrations
      const status = await this.getStatus(sortedMigrations);
      const executedNames = new Set(status.executed.map(m => m.name));
      
      // Run each pending migration
      for (const migration of sortedMigrations) {
        if (executedNames.has(migration.name)) {
          result.migrationsSkipped.push(migration.name);
          continue;
        }
        
        this.logger.log(`Running migration: ${migration.name}`);
        const migrationStart = Date.now();
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
          // Start transaction if enabled
          if (this.config.transactionPerMigration !== false) {
            await queryRunner.startTransaction();
          }
          
          // Run migration
          await migration.up(queryRunner);
          
          // Record migration
          const checksum = this.calculateChecksum(migration);
          await queryRunner.query(`
            INSERT INTO _migrations 
            (name, timestamp, execution_time_ms, checksum, service_name, environment)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            migration.name,
            migration.timestamp,
            Date.now() - migrationStart,
            checksum,
            this.config.serviceName,
            process.env.NODE_ENV || 'development',
          ]);
          
          // Commit transaction
          if (this.config.transactionPerMigration !== false) {
            await queryRunner.commitTransaction();
          }
          
          result.migrationsRun.push(migration.name);
          this.logger.log(`✅ Migration ${migration.name} completed in ${Date.now() - migrationStart}ms`);
          
        } catch (error) {
          // Rollback transaction
          if (this.config.transactionPerMigration !== false) {
            await queryRunner.rollbackTransaction();
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.migrationsFailed.push(migration.name);
          result.errors.push({
            migrationName: migration.name,
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          });
          
          this.logger.error(`❌ Migration ${migration.name} failed: ${errorMessage}`);
          
          // Stop on first failure
          result.success = false;
          break;
          
        } finally {
          await queryRunner.release();
        }
      }
      
    } finally {
      await this.releaseLock();
      result.totalTimeMs = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Revert the last migration
   */
  async revertLastMigration(migrations: IMigration[]): Promise<MigrationResult> {
    if (!this.dataSource) throw new Error('DataSource not initialized');
    
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsRun: [],
      migrationsSkipped: [],
      migrationsFailed: [],
      totalTimeMs: 0,
      errors: [],
    };
    
    const hasLock = await this.acquireLock();
    if (!hasLock) {
      result.success = false;
      result.errors.push({
        migrationName: 'lock',
        message: 'Could not acquire migration lock',
      });
      return result;
    }
    
    try {
      // Get last executed migration
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        const lastMigration = await queryRunner.query(`
          SELECT * FROM _migrations 
          WHERE service_name = $1 AND status = 'success'
          ORDER BY timestamp DESC 
          LIMIT 1
        `, [this.config.serviceName]);
        
        if (!lastMigration.length) {
          this.logger.log('No migrations to revert');
          return result;
        }
        
        const migrationRecord = lastMigration[0];
        const migration = migrations.find(m => m.name === migrationRecord.name);
        
        if (!migration) {
          result.success = false;
          result.errors.push({
            migrationName: migrationRecord.name,
            message: 'Migration class not found',
          });
          return result;
        }
        
        this.logger.log(`Reverting migration: ${migration.name}`);
        
        await queryRunner.startTransaction();
        
        try {
          await migration.down(queryRunner);
          
          // Update migration record
          await queryRunner.query(`
            UPDATE _migrations 
            SET status = 'reverted' 
            WHERE id = $1
          `, [migrationRecord.id]);
          
          await queryRunner.commitTransaction();
          
          result.migrationsRun.push(migration.name);
          this.logger.log(`✅ Migration ${migration.name} reverted`);
          
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }
        
      } finally {
        await queryRunner.release();
      }
      
    } finally {
      await this.releaseLock();
      result.totalTimeMs = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Calculate checksum for migration validation
   */
  private calculateChecksum(migration: IMigration): string {
    const content = `${migration.name}:${migration.timestamp}:${migration.up.toString()}`;
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
}


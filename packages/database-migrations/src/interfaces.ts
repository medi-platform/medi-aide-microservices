/**
 * Migration Interfaces
 * 
 * Enterprise-grade type definitions for database migrations.
 */

export interface MigrationConfig {
  /** Service name for audit logging */
  serviceName: string;
  
  /** Database connection options (optional - can use TypeORM connection) */
  database?: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
  };
  
  /** Path to migration files (optional) */
  migrationsPath?: string;
  
  /** Table name for tracking migrations */
  migrationsTable?: string;
  
  /** Enable transaction per migration */
  transactionPerMigration?: boolean;
  
  /** Timeout for each migration in milliseconds */
  migrationTimeout?: number;
  
  /** Enable dry run mode */
  dryRun?: boolean;
  
  /** Enable verbose logging */
  verbose?: boolean;
}

export interface MigrationRecord {
  id: string;
  name: string;
  timestamp: number;
  executedAt: Date;
  executionTimeMs: number;
  status: 'success' | 'failed' | 'reverted';
  checksum: string;
  serviceName: string;
  environment: string;
  executedBy: string;
  errorMessage?: string;
}

export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  migrationsSkipped: string[];
  migrationsFailed: string[];
  totalTimeMs: number;
  errors: MigrationError[];
}

export interface MigrationError {
  migrationName: string;
  message: string;
  stack?: string;
  code?: string;
}

export interface MigrationStatus {
  pending: string[];
  executed: MigrationRecord[];
  lastExecuted?: MigrationRecord;
  databaseVersion: string;
  isUpToDate: boolean;
}

export interface MigrationLock {
  id: string;
  serviceName: string;
  lockedAt: Date;
  lockedBy: string;
  expiresAt: Date;
}

export interface IMigration {
  name: string;
  timestamp: number;
  up(queryRunner: any): Promise<void>;
  down(queryRunner: any): Promise<void>;
}


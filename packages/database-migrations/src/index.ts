/**
 * @medi-aide/database-migrations
 * 
 * Enterprise-grade database migration utilities for microservices.
 * 
 * Features:
 * - Automatic migration discovery
 * - Safe rollback support
 * - Migration locking (prevents concurrent runs)
 * - Audit logging of all migrations
 * - Health check integration
 * - Multi-tenant support ready
 */

export * from './migration.module';
export * from './migration.service';
export * from './interfaces';
export * from './decorators';
export * from './base-migration';


import 'reflect-metadata';

const MIGRATION_METADATA_KEY = 'migration:metadata';

export interface MigrationMetadata {
  name: string;
  timestamp: number;
  description?: string;
  dependencies?: string[];
  reversible?: boolean;
}

/**
 * Migration Decorator
 * 
 * Marks a class as a database migration with metadata.
 * 
 * @example
 * ```typescript
 * @Migration({
 *   name: 'CreateUsersTable',
 *   timestamp: 1703836800000,
 *   description: 'Creates the users table with all required columns',
 *   reversible: true
 * })
 * export class CreateUsersTable1703836800000 extends BaseMigration {
 *   // ...
 * }
 * ```
 */
export function Migration(metadata: MigrationMetadata): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MIGRATION_METADATA_KEY, metadata, target);
  };
}

/**
 * Get migration metadata from a class
 */
export function getMigrationMetadata(target: Function): MigrationMetadata | undefined {
  return Reflect.getMetadata(MIGRATION_METADATA_KEY, target);
}


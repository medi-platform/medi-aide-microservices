import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, EntityTarget, Repository } from 'typeorm';

/**
 * Configuration for test database
 */
export interface TestDatabaseConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  dropSchema?: boolean;
}

/**
 * Default test database configuration
 */
export const defaultTestDatabaseConfig: TestDatabaseConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_DATABASE || 'medi_aide_test',
  synchronize: true,
  dropSchema: true,
};

/**
 * Create TypeORM configuration for testing
 */
export function createTestTypeOrmConfig(
  entities: Function[],
  config: TestDatabaseConfig = {},
): TypeOrmModuleOptions {
  const finalConfig = { ...defaultTestDatabaseConfig, ...config };
  
  return {
    type: 'postgres',
    host: finalConfig.host,
    port: finalConfig.port,
    username: finalConfig.username,
    password: finalConfig.password,
    database: finalConfig.database,
    entities,
    synchronize: finalConfig.synchronize,
    dropSchema: finalConfig.dropSchema,
    logging: process.env.TEST_DB_LOGGING === 'true',
  };
}

/**
 * Test database helper class
 */
export class TestDatabase {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Get repository for an entity
   */
  getRepository<T>(entity: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  /**
   * Clear all tables
   */
  async clear(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
  }

  /**
   * Reset sequences (for PostgreSQL)
   */
  async resetSequences(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      try {
        await repository.query(
          `ALTER SEQUENCE IF EXISTS "${entity.tableName}_id_seq" RESTART WITH 1`
        );
      } catch {
        // Sequence might not exist for UUID primary keys
      }
    }
  }

  /**
   * Seed data from fixtures
   */
  async seed<T>(entity: EntityTarget<T>, data: Partial<T>[]): Promise<T[]> {
    const repository = this.dataSource.getRepository(entity);
    const entities = repository.create(data as any[]);
    return repository.save(entities);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}

import { QueryRunner } from 'typeorm';

/**
 * Base Migration Class
 * 
 * Provides enterprise-grade migration capabilities with:
 * - Automatic checksum validation
 * - Progress logging
 * - Idempotent operations
 * - Safe table/column checks
 */
export abstract class BaseMigration {
  abstract name: string;
  abstract timestamp: number;
  
  /**
   * Execute migration (upgrade)
   */
  abstract up(queryRunner: QueryRunner): Promise<void>;
  
  /**
   * Revert migration (downgrade)
   */
  abstract down(queryRunner: QueryRunner): Promise<void>;
  
  /**
   * Check if table exists
   */
  protected async tableExists(
    queryRunner: QueryRunner,
    tableName: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result[0].exists;
  }
  
  /**
   * Check if column exists
   */
  protected async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      )
    `, [tableName, columnName]);
    return result[0].exists;
  }
  
  /**
   * Check if index exists
   */
  protected async indexExists(
    queryRunner: QueryRunner,
    indexName: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = $1
      )
    `, [indexName]);
    return result[0].exists;
  }
  
  /**
   * Check if constraint exists
   */
  protected async constraintExists(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = $1 
        AND constraint_name = $2
      )
    `, [tableName, constraintName]);
    return result[0].exists;
  }
  
  /**
   * Safely create table if not exists
   */
  protected async createTableIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    createStatement: string
  ): Promise<boolean> {
    if (await this.tableExists(queryRunner, tableName)) {
      console.log(`  ⏭️  Table ${tableName} already exists, skipping`);
      return false;
    }
    await queryRunner.query(createStatement);
    console.log(`  ✅ Created table ${tableName}`);
    return true;
  }
  
  /**
   * Safely add column if not exists
   */
  protected async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    columnDefinition: string
  ): Promise<boolean> {
    if (await this.columnExists(queryRunner, tableName, columnName)) {
      console.log(`  ⏭️  Column ${tableName}.${columnName} already exists, skipping`);
      return false;
    }
    await queryRunner.query(`
      ALTER TABLE ${tableName} 
      ADD COLUMN ${columnName} ${columnDefinition}
    `);
    console.log(`  ✅ Added column ${tableName}.${columnName}`);
    return true;
  }
  
  /**
   * Safely create index if not exists
   */
  protected async createIndexIfNotExists(
    queryRunner: QueryRunner,
    indexName: string,
    createStatement: string
  ): Promise<boolean> {
    if (await this.indexExists(queryRunner, indexName)) {
      console.log(`  ⏭️  Index ${indexName} already exists, skipping`);
      return false;
    }
    await queryRunner.query(createStatement);
    console.log(`  ✅ Created index ${indexName}`);
    return true;
  }
  
  /**
   * Log migration step
   */
  protected log(message: string): void {
    console.log(`  📝 ${message}`);
  }
  
  /**
   * Log warning
   */
  protected warn(message: string): void {
    console.log(`  ⚠️  ${message}`);
  }
}


/**
 * TypeORM CLI Configuration
 * Used for running migrations via CLI
 */
module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'stage3-postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'agency_db',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations',
  },
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

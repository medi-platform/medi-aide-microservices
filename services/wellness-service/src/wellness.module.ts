import { ConsulModule } from './consul.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WellnessMetric } from './entities/wellness-metric.entity';
import { WellnessController } from './controllers/wellness.controller';
import { WellnessService } from './services/wellness.service';
import { SimpleHealthController } from './controllers/health.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';
const consulEnabled = process.env.DISABLE_CONSUL !== 'true';

const moduleImports = [
  ConfigModule.forRoot({ isGlobal: true }),
  ...(dbEnabled
    ? [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || process.env.DB_HOST || 'stage3-postgres',
          port: Number(process.env.DATABASE_PORT || process.env.DB_PORT || 5432),
          username: process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'wellness_db',
          entities: [WellnessMetric],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([WellnessMetric]),
      ]
    : []),
  ...(consulEnabled ? [ConsulModule] : []),
];

const controllersArr = dbEnabled ? [WellnessController] : [SimpleHealthController];
const providersArr = dbEnabled ? [WellnessService] : [];

@Module({
  imports: moduleImports,
  controllers: controllersArr,
  providers: providersArr,
})
export class WellnessModule {}

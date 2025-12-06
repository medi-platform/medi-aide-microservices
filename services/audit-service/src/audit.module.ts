import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuditLog } from './entities/audit-log.entity';
import { ComplianceRecord } from './entities/compliance-record.entity';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { PingController } from './controllers/ping.controller';
import { SchemaInitService } from './services/schema-init.service';
import { MetricsController } from './controllers/metrics.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(dbEnabled
      ? [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'stage3-postgres',
            port: Number(process.env.DB_PORT || 5432),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_DATABASE || 'audit_db',
            entities: [AuditLog, ComplianceRecord],
            synchronize: process.env.NODE_ENV === 'development',
          }),
          TypeOrmModule.forFeature([AuditLog, ComplianceRecord]),
        ]
      : []),
  ],
  controllers: dbEnabled ? [AuditController, PingController, MetricsController] : [PingController, MetricsController],
  providers: dbEnabled ? [AuditService, SchemaInitService] : [],
})
export class AuditModule {}

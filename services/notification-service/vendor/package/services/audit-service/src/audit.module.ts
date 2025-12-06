import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuditLog } from './entities/audit-log.entity';
import { ComplianceRecord } from './entities/compliance-record.entity';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'stage3-postgres',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'audit_db',
      entities: [AuditLog, ComplianceRecord,
    ConsulModule
  ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([AuditLog, ComplianceRecord]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}

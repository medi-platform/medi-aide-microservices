/**
 * 🩺 CAREGIVER MODULE - PROFESSIONAL CAREGIVER MANAGEMENT
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';

// Controllers
import { HealthController } from './controllers/health.controller';
import { CaregiverController } from './controllers/caregiver.controller';
import { AvailabilityController } from './controllers/availability.controller';
import { CertificationController } from './controllers/certification.controller';
import { PerformanceController } from './controllers/performance.controller';
import { DocumentController } from './controllers/document.controller';

// Services
import { CaregiverService } from './services/caregiver.service';
import { AvailabilityService } from './services/availability.service';
import { CertificationService } from './services/certification.service';
import { PerformanceService } from './services/performance.service';
import { DocumentService } from './services/document.service';

// Entities
import { CaregiverProfile } from './entities/caregiver-profile.entity';
import { CaregiverAvailability } from './entities/caregiver-availability.entity';
import { CaregiverCertification } from './entities/caregiver-certification.entity';
import { CaregiverPerformance } from './entities/caregiver-performance.entity';
import { CaregiverDocument } from './entities/caregiver-document.entity';
import { CaregiverSkill } from './entities/caregiver-skill.entity';

const entities = [
  CaregiverProfile,
  CaregiverAvailability,
  CaregiverCertification,
  CaregiverPerformance,
  CaregiverDocument,
  CaregiverSkill,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'caregiver_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('DB_LOGGING', 'false') === 'true',
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [
    HealthController,
    CaregiverController,
    AvailabilityController,
    CertificationController,
    PerformanceController,
    DocumentController,
  ],
  providers: [
    CaregiverService,
    AvailabilityService,
    CertificationService,
    PerformanceService,
    DocumentService,
  ],
})
export class CaregiverModule {}


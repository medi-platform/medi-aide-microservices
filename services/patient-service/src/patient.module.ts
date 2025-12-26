import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { PatientController } from './controllers/patient.controller';
import { FamilyController } from './controllers/family.controller';
import { MedicalController } from './controllers/medical.controller';
import { PatientService } from './services/patient.service';
import { FamilyService } from './services/family.service';
import { MedicalService } from './services/medical.service';
import { Patient } from './entities/patient.entity';
import { FamilyMember } from './entities/family-member.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';

const entities = [Patient, FamilyMember, MedicalRecord, EmergencyContact];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'patient_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [HealthController, PatientController, FamilyController, MedicalController],
  providers: [PatientService, FamilyService, MedicalService],
})
export class PatientModule {}


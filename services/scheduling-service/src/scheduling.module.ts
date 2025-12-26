import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { AppointmentController } from './controllers/appointment.controller';
import { CalendarController } from './controllers/calendar.controller';
import { ScheduleService } from './services/schedule.service';
import { AppointmentService } from './services/appointment.service';
import { CalendarService } from './services/calendar.service';
import { Schedule } from './entities/schedule.entity';
import { Appointment } from './entities/appointment.entity';
import { RecurringPattern } from './entities/recurring-pattern.entity';
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';
import { SchedulingEventPublisher } from './services/scheduling-event-publisher.service';

const entities = [Schedule, Appointment, RecurringPattern];

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
        database: config.get('DB_DATABASE', 'scheduling_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'scheduling-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'scheduling-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        groupId: 'scheduling-service-group',
        retry: { maxRetries: 5, initialDelayMs: 100 },
        deadLetterQueue: { enabled: true, topicSuffix: '.dlq', maxRetries: 3 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'scheduling-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: ['care-request-service', 'notification-service', 'evv-service'],
      }),
    }),
  ],
  controllers: [HealthController, ScheduleController, AppointmentController, CalendarController],
  providers: [ScheduleService, AppointmentService, CalendarService, SchedulingEventPublisher],
  exports: [ScheduleService, SchedulingEventPublisher],
})
export class SchedulingModule {}



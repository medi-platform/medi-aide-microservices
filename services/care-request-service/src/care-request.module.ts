import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { CareRequestController } from './controllers/care-request.controller';
import { MatchingController } from './controllers/matching.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { CareRequestService } from './services/care-request.service';
import { MatchingService } from './services/matching.service';
import { WorkflowService } from './services/workflow.service';
import { CareRequest } from './entities/care-request.entity';
import { CareRequestMatch } from './entities/care-request-match.entity';
import { CareRequestHistory } from './entities/care-request-history.entity';

const entities = [CareRequest, CareRequestMatch, CareRequestHistory];

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
        database: config.get('DB_DATABASE', 'care_request_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [HealthController, CareRequestController, MatchingController, WorkflowController],
  providers: [CareRequestService, MatchingService, WorkflowService],
})
export class CareRequestModule {}


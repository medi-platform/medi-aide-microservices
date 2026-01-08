import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAuthModule } from '@medi-aide/service-auth';

// Entities
import { Contract } from './entities/contract.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractSignature } from './entities/contract-signature.entity';
import { ContractEvent } from './entities/contract-event.entity';

// Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

// Services
import { ContractService } from './services/contract.service';
import { SignatureService } from './services/signature.service';
import { TemplateService } from './services/template.service';

const entities = [
  Contract,
  ContractTemplate,
  ContractSignature,
  ContractEvent,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'contract-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: (config.get('ALLOWED_SERVICES', 'api-gateway,care-request-service') as string)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'stage3-postgres'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'service_user'),
        password: configService.get('DB_PASSWORD', 'service123'),
        database: configService.get('DB_DATABASE', 'contract_db'),
        entities,
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
  ],
  providers: [
    ContractService,
    SignatureService,
    TemplateService,
  ],
  exports: [
    ContractService,
    SignatureService,
    TemplateService,
  ],
})
export class ContractModule {}

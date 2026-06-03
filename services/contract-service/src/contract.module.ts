import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAuthModule } from '@medi-aide/service-auth';

// Existing Entities
import { Contract } from './entities/contract.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractSignature } from './entities/contract-signature.entity';
import { ContractEvent } from './entities/contract-event.entity';

// Phase 5E: New Entities
import { ContractAmendment } from './entities/contract-amendment.entity';
import { ContractRenewal } from './entities/contract-renewal.entity';
import { ContractDispute } from './entities/contract-dispute.entity';
import { ContractClause } from './entities/contract-clause.entity';
import { ContractVersion } from './entities/contract-version.entity';
import { AgencyContract } from './entities/agency-contract.entity';

// Infrastructure Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

// Phase 5E: Business Controllers
import { ContractController } from './controllers/contract.controller';
import { AmendmentController } from './controllers/amendment.controller';
import { RenewalController } from './controllers/renewal.controller';
import { DisputeController } from './controllers/dispute.controller';
import { ClauseController } from './controllers/clause.controller';
import { VersionController } from './controllers/version.controller';
import { AgencyContractController } from './controllers/agency-contract.controller';

// Existing Services
import { ContractService } from './services/contract.service';
import { SignatureService } from './services/signature.service';
import { TemplateService } from './services/template.service';

// Phase 5E: New Services
import { AmendmentService } from './services/amendment.service';
import { RenewalService } from './services/renewal.service';
import { DisputeService } from './services/dispute.service';
import { ClauseService } from './services/clause.service';
import { VersionService } from './services/version.service';
import { AgencyContractService } from './services/agency-contract.service';

/**
 * Contract Service Module
 * 
 * Phase 5E Enhancement: Contract Service Enhancement
 * 
 * Entities:
 * - Existing: Contract, ContractTemplate, ContractSignature, ContractEvent
 * - New: ContractAmendment, ContractRenewal, ContractDispute, ContractClause, ContractVersion, AgencyContract
 * 
 * Total: 10 entities (4 existing + 6 new)
 */
const entities = [
  // Existing Entities
  Contract,
  ContractTemplate,
  ContractSignature,
  ContractEvent,
  // Phase 5E: New Entities
  ContractAmendment,
  ContractRenewal,
  ContractDispute,
  ContractClause,
  ContractVersion,
  AgencyContract,
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
    // Infrastructure Controllers
    HealthController,
    MetricsController,
    PingController,
    // Phase 5E: Business Controllers
    ContractController,
    AmendmentController,
    RenewalController,
    DisputeController,
    ClauseController,
    VersionController,
    AgencyContractController,
  ],
  providers: [
    // Existing Services
    ContractService,
    SignatureService,
    TemplateService,
    // Phase 5E: New Services
    AmendmentService,
    RenewalService,
    DisputeService,
    ClauseService,
    VersionService,
    AgencyContractService,
  ],
  exports: [
    // Existing Services
    ContractService,
    SignatureService,
    TemplateService,
    // Phase 5E: New Services
    AmendmentService,
    RenewalService,
    DisputeService,
    ClauseService,
    VersionService,
    AgencyContractService,
  ],
})
export class ContractModule {}

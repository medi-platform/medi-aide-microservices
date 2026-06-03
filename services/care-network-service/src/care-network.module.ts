import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAuthModule } from '@medi-aide/service-auth';
import configuration from './config/configuration';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { NetworkController } from './controllers/network.controller';
import {
  LegacyCoffeeMeetsController,
  LegacyCommunityController,
  LegacyDelegationController,
  LegacyGroupsController,
} from './controllers/legacy-paths.controller';

import { CommunityGroup } from './entities/community-group.entity';
import { GroupMember } from './entities/group-member.entity';
import { CoffeeMeet } from './entities/coffee-meet.entity';
import { CoffeeMeetParticipant } from './entities/coffee-meet-participant.entity';

import { GroupService } from './services/group.service';
import { CoffeeMeetService } from './services/coffee-meet.service';

const entities = [
  CommunityGroup,
  GroupMember,
  CoffeeMeet,
  CoffeeMeetParticipant,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [configuration],
    }),
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'care-network-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: (config.get('ALLOWED_SERVICES', 'api-gateway,user-service,caregiver-service') as string)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'stage3-postgres'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'care_network_db'),
        entities,
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
    NetworkController,
    // Legacy/root path controllers for Kong route parity
    LegacyGroupsController,
    LegacyCoffeeMeetsController,
    LegacyCommunityController,
    LegacyDelegationController,
  ],
  providers: [
    GroupService,
    CoffeeMeetService,
  ],
})
export class CareNetworkModule {}



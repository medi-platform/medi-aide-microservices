import { Module, DynamicModule, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Tenant } from './tenant.entity';
import { TenantContextService } from './tenant.context';
import { TenantService } from './tenant.service';
import { BillingService } from './billing.service';
import { BrandingService } from './branding.service';
import { QuotaService } from './quota.service';
import { TenantMiddleware, CustomDomainMiddleware } from './tenant.middleware';
import {
  TenantGuard,
  TenantFeatureGuard,
  TenantPlanGuard,
  TenantQuotaGuard,
  TenantMembershipGuard,
  CrossTenantGuard,
} from './tenant.guard';

export interface MultiTenancyModuleOptions {
  enableBilling?: boolean;
  enableBranding?: boolean;
  enableQuotas?: boolean;
  enableCustomDomains?: boolean;
}

@Global()
@Module({})
export class MultiTenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CustomDomainMiddleware, TenantMiddleware)
      .forRoutes('*');
  }

  static forRoot(options: MultiTenancyModuleOptions = {}): DynamicModule {
    const defaultOptions: MultiTenancyModuleOptions = {
      enableBilling: true,
      enableBranding: true,
      enableQuotas: true,
      enableCustomDomains: true,
      ...options,
    };

    const providers: any[] = [
      TenantContextService,
      TenantService,
      TenantGuard,
      TenantFeatureGuard,
      TenantPlanGuard,
      TenantMembershipGuard,
      CrossTenantGuard,
    ];

    const exports: any[] = [
      TenantContextService,
      TenantService,
      TenantGuard,
      TenantFeatureGuard,
      TenantPlanGuard,
      TenantMembershipGuard,
      CrossTenantGuard,
    ];

    if (defaultOptions.enableBilling) {
      providers.push(BillingService);
      exports.push(BillingService);
    }

    if (defaultOptions.enableBranding) {
      providers.push(BrandingService);
      exports.push(BrandingService);
    }

    if (defaultOptions.enableQuotas) {
      providers.push(QuotaService, TenantQuotaGuard);
      exports.push(QuotaService, TenantQuotaGuard);
    }

    if (defaultOptions.enableCustomDomains) {
      providers.push(CustomDomainMiddleware);
    }

    providers.push(TenantMiddleware);

    return {
      module: MultiTenancyModule,
      imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Tenant]),
      ],
      providers,
      exports,
    };
  }
}

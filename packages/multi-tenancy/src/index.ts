/**
 * @medi-aide/multi-tenancy
 *
 * Multi-tenancy utilities for Medi-Aide healthcare platform
 * Phase 16: Multi-Tenancy Enhancements
 */

export {
  TenantContextService,
  runWithTenant,
  getCurrentTenant,
  getCurrentTenantId,
  hasTenantContext,
  DEFAULT_TENANT_SETTINGS,
  PLAN_FEATURES,
  PLAN_QUOTAS,
} from './tenant.context';
export type {
  TenantContext,
  TenantSettings,
  TenantQuotas,
} from './tenant.context';
export * from './tenant.entity';
export * from './tenant.middleware';
export * from './tenant.guard';
export * from './tenant.decorator';
export * from './tenant.service';
export * from './billing.service';
export * from './branding.service';
export * from './quota.service';
export * from './tenant.module';

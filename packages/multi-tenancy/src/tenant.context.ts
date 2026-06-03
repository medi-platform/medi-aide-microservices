/**
 * Tenant Context Management
 * Uses AsyncLocalStorage for request-scoped tenant isolation
 */

import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  settings: TenantSettings;
  features: string[];
  quotas: TenantQuotas;
}

export interface TenantSettings {
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    companyName: string;
  };
  evvEnabled: boolean;
  billingEnabled: boolean;
  hipaaCompliant: boolean;
  ssoEnabled: boolean;
  customDomain?: string;
}

export interface TenantQuotas {
  maxUsers: number;
  maxCaregivers: number;
  maxPatients: number;
  maxStorageGB: number;
  maxAPICallsPerDay: number;
  currentUsers: number;
  currentCaregivers: number;
  currentPatients: number;
  currentStorageGB: number;
}

// AsyncLocalStorage for tenant context
const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Run callback within tenant context
 */
export function runWithTenant<T>(
  context: TenantContext,
  callback: () => T,
): T {
  return tenantStorage.run(context, callback);
}

/**
 * Get current tenant context
 */
export function getCurrentTenant(): TenantContext | undefined {
  return tenantStorage.getStore();
}

/**
 * Get current tenant ID or throw
 */
export function getCurrentTenantId(): string {
  const context = getCurrentTenant();
  if (!context) {
    throw new Error('No tenant context available');
  }
  return context.tenantId;
}

/**
 * Check if running in tenant context
 */
export function hasTenantContext(): boolean {
  return tenantStorage.getStore() !== undefined;
}

/**
 * Injectable tenant context service
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private context: TenantContext | undefined;

  setContext(context: TenantContext): void {
    this.context = context;
  }

  getContext(): TenantContext | undefined {
    return this.context || getCurrentTenant();
  }

  getTenantId(): string {
    const ctx = this.getContext();
    if (!ctx) throw new Error('No tenant context');
    return ctx.tenantId;
  }

  getTenantCode(): string {
    const ctx = this.getContext();
    if (!ctx) throw new Error('No tenant context');
    return ctx.tenantCode;
  }

  getSettings(): TenantSettings {
    const ctx = this.getContext();
    if (!ctx) throw new Error('No tenant context');
    return ctx.settings;
  }

  getQuotas(): TenantQuotas {
    const ctx = this.getContext();
    if (!ctx) throw new Error('No tenant context');
    return ctx.quotas;
  }

  hasFeature(feature: string): boolean {
    const ctx = this.getContext();
    if (!ctx) return false;
    return ctx.features.includes(feature);
  }

  getPlan(): TenantContext['plan'] {
    const ctx = this.getContext();
    if (!ctx) throw new Error('No tenant context');
    return ctx.plan;
  }
}

/**
 * Default tenant settings
 */
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  timezone: 'America/Toronto',
  dateFormat: 'YYYY-MM-DD',
  currency: 'CAD',
  language: 'en',
  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    companyName: 'Medi-Aide',
  },
  evvEnabled: true,
  billingEnabled: true,
  hipaaCompliant: true,
  ssoEnabled: false,
};

/**
 * Plan-based feature sets
 */
export const PLAN_FEATURES: Record<TenantContext['plan'], string[]> = {
  starter: [
    'basic_scheduling',
    'basic_reporting',
    'email_support',
  ],
  professional: [
    'basic_scheduling',
    'advanced_scheduling',
    'basic_reporting',
    'advanced_reporting',
    'evv',
    'mobile_app',
    'email_support',
    'phone_support',
  ],
  enterprise: [
    'basic_scheduling',
    'advanced_scheduling',
    'basic_reporting',
    'advanced_reporting',
    'custom_reporting',
    'evv',
    'mobile_app',
    'api_access',
    'sso',
    'custom_branding',
    'priority_support',
    'dedicated_account_manager',
    'hipaa_compliance',
    'audit_logs',
  ],
  custom: [], // Defined per tenant
};

/**
 * Plan-based quota limits
 */
export const PLAN_QUOTAS: Record<TenantContext['plan'], Omit<TenantQuotas, 'currentUsers' | 'currentCaregivers' | 'currentPatients' | 'currentStorageGB'>> = {
  starter: {
    maxUsers: 10,
    maxCaregivers: 25,
    maxPatients: 50,
    maxStorageGB: 5,
    maxAPICallsPerDay: 1000,
  },
  professional: {
    maxUsers: 50,
    maxCaregivers: 200,
    maxPatients: 500,
    maxStorageGB: 50,
    maxAPICallsPerDay: 10000,
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxCaregivers: -1,
    maxPatients: -1,
    maxStorageGB: 500,
    maxAPICallsPerDay: -1,
  },
  custom: {
    maxUsers: -1,
    maxCaregivers: -1,
    maxPatients: -1,
    maxStorageGB: -1,
    maxAPICallsPerDay: -1,
  },
};

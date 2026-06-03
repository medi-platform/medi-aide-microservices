/**
 * Tenant Decorators
 * Convenient decorators for working with tenants
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant.context';

/**
 * Get current tenant from request
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext;

    if (!tenant) return null;

    return data ? tenant[data] : tenant;
  },
);

/**
 * Get current tenant ID
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.tenant?.tenantId;
  },
);

/**
 * Get tenant settings
 */
export const TenantSettings = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const settings = request.tenant?.settings;

    if (!settings) return null;

    return key ? settings[key] : settings;
  },
);

/**
 * Get tenant branding
 */
export const TenantBranding = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant?.settings?.branding || null;
  },
);

/**
 * Check if tenant has a feature
 */
export const HasFeature = createParamDecorator(
  (feature: string, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext;

    if (!tenant || !tenant.features) return false;

    return tenant.features.includes(feature);
  },
);

/**
 * Get tenant plan
 */
export const TenantPlan = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant?.plan;
  },
);

/**
 * Get tenant quotas
 */
export const TenantQuotas = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const quotas = request.tenant?.quotas;

    if (!quotas) return null;

    return key ? quotas[key] : quotas;
  },
);

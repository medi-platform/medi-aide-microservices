/**
 * Tenant Guards
 * Authorization guards for tenant-level access control
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService, TenantContext } from './tenant.context';
import { QuotaService } from './quota.service';

export const TENANT_FEATURE_KEY = 'tenant:feature';
export const TENANT_PLAN_KEY = 'tenant:plan';
export const TENANT_QUOTA_KEY = 'tenant:quota';

/**
 * Guard to ensure tenant context exists
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = this.tenantContext.getContext();
    if (!ctx) {
      throw new ForbiddenException('Tenant context required');
    }
    return true;
  }
}

/**
 * Guard to check if tenant has a specific feature
 */
@Injectable()
export class TenantFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.get<string>(
      TENANT_FEATURE_KEY,
      context.getHandler(),
    );

    if (!requiredFeature) return true;

    const ctx = this.tenantContext.getContext();
    if (!ctx) {
      throw new ForbiddenException('Tenant context required');
    }

    if (!ctx.features.includes(requiredFeature)) {
      throw new ForbiddenException(`Feature '${requiredFeature}' not available in your plan`);
    }

    return true;
  }
}

/**
 * Guard to check if tenant has minimum plan level
 */
@Injectable()
export class TenantPlanGuard implements CanActivate {
  private planHierarchy: Record<TenantContext['plan'], number> = {
    starter: 1,
    professional: 2,
    enterprise: 3,
    custom: 4,
  };

  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.get<TenantContext['plan']>(
      TENANT_PLAN_KEY,
      context.getHandler(),
    );

    if (!requiredPlan) return true;

    const ctx = this.tenantContext.getContext();
    if (!ctx) {
      throw new ForbiddenException('Tenant context required');
    }

    const requiredLevel = this.planHierarchy[requiredPlan];
    const currentLevel = this.planHierarchy[ctx.plan];

    if (currentLevel < requiredLevel) {
      throw new ForbiddenException(`This feature requires ${requiredPlan} plan or higher`);
    }

    return true;
  }
}

/**
 * Guard to check tenant quota limits
 */
@Injectable()
export class TenantQuotaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
    private quotaService: QuotaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaType = this.reflector.get<string>(
      TENANT_QUOTA_KEY,
      context.getHandler(),
    );

    if (!quotaType) return true;

    const ctx = this.tenantContext.getContext();
    if (!ctx) {
      throw new ForbiddenException('Tenant context required');
    }

    const canProceed = await this.quotaService.checkQuota(
      ctx.tenantId,
      quotaType as any,
    );

    if (!canProceed) {
      throw new ForbiddenException(`Quota limit reached for ${quotaType}`);
    }

    return true;
  }
}

/**
 * Guard to ensure user belongs to the tenant in the request
 */
@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ctx = this.tenantContext.getContext();

    if (!ctx || !user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins can access any tenant
    if (user.role === 'super_admin') {
      return true;
    }

    // User must belong to the current tenant
    if (user.tenantId !== ctx.tenantId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return true;
  }
}

/**
 * Guard for cross-tenant access (admin only)
 */
@Injectable()
export class CrossTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only super admins can access cross-tenant
    if (!user || user.role !== 'super_admin') {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}

// Decorators

/**
 * Require a specific feature
 */
export const RequireFeature = (feature: string) =>
  SetMetadata(TENANT_FEATURE_KEY, feature);

/**
 * Require minimum plan level
 */
export const RequirePlan = (plan: TenantContext['plan']) =>
  SetMetadata(TENANT_PLAN_KEY, plan);

/**
 * Check quota before action
 */
export const CheckQuota = (quotaType: string) =>
  SetMetadata(TENANT_QUOTA_KEY, quotaType);

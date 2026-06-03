/**
 * Tenant Quota Service
 * Manages and enforces tenant resource quotas
 */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantQuotas, PLAN_QUOTAS } from './tenant.context';

export type QuotaType =
  | 'users'
  | 'caregivers'
  | 'patients'
  | 'storage'
  | 'apiCalls';

export interface QuotaStatus {
  type: QuotaType;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  isExceeded: boolean;
  isNearLimit: boolean; // > 80%
}

export interface QuotaCheckResult {
  allowed: boolean;
  quotaStatus: QuotaStatus;
  message?: string;
}

@Injectable()
export class QuotaService {
  // In-memory counters (in production, use Redis)
  private apiCallCounters = new Map<string, { count: number; resetAt: number }>();
  private usageCounters = new Map<string, Map<QuotaType, number>>();

  constructor(private tenantService: TenantService) {}

  /**
   * Check if quota allows the operation
   */
  async checkQuota(
    tenantId: string,
    quotaType: QuotaType,
    increment: number = 1,
  ): Promise<boolean> {
    const result = await this.checkQuotaDetailed(tenantId, quotaType, increment);
    return result.allowed;
  }

  /**
   * Check quota with detailed result
   */
  async checkQuotaDetailed(
    tenantId: string,
    quotaType: QuotaType,
    increment: number = 1,
  ): Promise<QuotaCheckResult> {
    const tenant = await this.tenantService.getTenant(tenantId);
    const quotas = tenant.quotas as TenantQuotas || PLAN_QUOTAS[tenant.plan];

    const limit = this.getLimit(quotas, quotaType);
    const current = await this.getCurrentUsage(tenantId, quotaType);
    const newValue = current + increment;

    const isUnlimited = limit === -1;
    const isExceeded = !isUnlimited && newValue > limit;
    const percentage = isUnlimited ? 0 : (current / limit) * 100;
    const isNearLimit = !isUnlimited && percentage >= 80;

    const quotaStatus: QuotaStatus = {
      type: quotaType,
      current,
      limit,
      percentage: Math.round(percentage),
      isUnlimited,
      isExceeded,
      isNearLimit,
    };

    if (isExceeded) {
      return {
        allowed: false,
        quotaStatus,
        message: `${quotaType} quota exceeded. Current: ${current}, Limit: ${limit}`,
      };
    }

    return { allowed: true, quotaStatus };
  }

  /**
   * Get all quota statuses for a tenant
   */
  async getAllQuotaStatuses(tenantId: string): Promise<QuotaStatus[]> {
    const quotaTypes: QuotaType[] = ['users', 'caregivers', 'patients', 'storage', 'apiCalls'];
    const statuses: QuotaStatus[] = [];

    for (const type of quotaTypes) {
      const result = await this.checkQuotaDetailed(tenantId, type, 0);
      statuses.push(result.quotaStatus);
    }

    return statuses;
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(
    tenantId: string,
    quotaType: QuotaType,
    amount: number = 1,
  ): Promise<QuotaCheckResult> {
    const result = await this.checkQuotaDetailed(tenantId, quotaType, amount);

    if (result.allowed) {
      const tenantCounters = this.usageCounters.get(tenantId) || new Map();
      const current = tenantCounters.get(quotaType) || 0;
      tenantCounters.set(quotaType, current + amount);
      this.usageCounters.set(tenantId, tenantCounters);
    }

    return result;
  }

  /**
   * Decrement usage counter
   */
  async decrementUsage(
    tenantId: string,
    quotaType: QuotaType,
    amount: number = 1,
  ): Promise<void> {
    const tenantCounters = this.usageCounters.get(tenantId);
    if (tenantCounters) {
      const current = tenantCounters.get(quotaType) || 0;
      tenantCounters.set(quotaType, Math.max(0, current - amount));
    }
  }

  /**
   * Set usage counter to specific value
   */
  async setUsage(
    tenantId: string,
    quotaType: QuotaType,
    value: number,
  ): Promise<void> {
    const tenantCounters = this.usageCounters.get(tenantId) || new Map();
    tenantCounters.set(quotaType, value);
    this.usageCounters.set(tenantId, tenantCounters);
  }

  /**
   * Check and increment API call quota (rate limiting)
   */
  async checkApiQuota(tenantId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const tenant = await this.tenantService.getTenant(tenantId);
    const quotas = tenant.quotas as TenantQuotas || PLAN_QUOTAS[tenant.plan];
    const limit = quotas.maxAPICallsPerDay;

    // Get or create counter
    let counter = this.apiCallCounters.get(tenantId);
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    if (!counter || counter.resetAt < now) {
      counter = { count: 0, resetAt: midnight.getTime() };
    }

    // Unlimited API calls
    if (limit === -1) {
      counter.count++;
      this.apiCallCounters.set(tenantId, counter);
      return {
        allowed: true,
        remaining: -1,
        resetAt: new Date(counter.resetAt),
      };
    }

    // Check limit
    if (counter.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(counter.resetAt),
      };
    }

    counter.count++;
    this.apiCallCounters.set(tenantId, counter);

    return {
      allowed: true,
      remaining: limit - counter.count,
      resetAt: new Date(counter.resetAt),
    };
  }

  /**
   * Get usage alerts for a tenant
   */
  async getUsageAlerts(tenantId: string): Promise<{
    type: QuotaType;
    level: 'warning' | 'critical';
    message: string;
    percentage: number;
  }[]> {
    const statuses = await this.getAllQuotaStatuses(tenantId);
    const alerts: {
      type: QuotaType;
      level: 'warning' | 'critical';
      message: string;
      percentage: number;
    }[] = [];

    for (const status of statuses) {
      if (status.isUnlimited) continue;

      if (status.isExceeded) {
        alerts.push({
          type: status.type,
          level: 'critical',
          message: `${status.type} quota exceeded (${status.current}/${status.limit})`,
          percentage: status.percentage,
        });
      } else if (status.isNearLimit) {
        alerts.push({
          type: status.type,
          level: 'warning',
          message: `${status.type} usage at ${status.percentage}% (${status.current}/${status.limit})`,
          percentage: status.percentage,
        });
      }
    }

    return alerts;
  }

  /**
   * Enforce quota with exception
   */
  async enforceQuota(
    tenantId: string,
    quotaType: QuotaType,
    increment: number = 1,
  ): Promise<void> {
    const result = await this.checkQuotaDetailed(tenantId, quotaType, increment);

    if (!result.allowed) {
      throw new ForbiddenException(result.message);
    }
  }

  /**
   * Get quota recommendations based on usage
   */
  async getQuotaRecommendations(
    tenantId: string,
  ): Promise<{ quotaType: QuotaType; recommendation: string; suggestedPlan?: string }[]> {
    const statuses = await this.getAllQuotaStatuses(tenantId);
    const tenant = await this.tenantService.getTenant(tenantId);
    const recommendations: { quotaType: QuotaType; recommendation: string; suggestedPlan?: string }[] = [];

    for (const status of statuses) {
      if (status.isExceeded || status.percentage >= 90) {
        const upgradePlan = this.getUpgradePlan(tenant.plan);
        recommendations.push({
          quotaType: status.type,
          recommendation: `${status.type} quota is ${status.isExceeded ? 'exceeded' : 'nearly full'}. Consider upgrading.`,
          suggestedPlan: upgradePlan,
        });
      }
    }

    return recommendations;
  }

  private getLimit(quotas: TenantQuotas, type: QuotaType): number {
    switch (type) {
      case 'users': return quotas.maxUsers;
      case 'caregivers': return quotas.maxCaregivers;
      case 'patients': return quotas.maxPatients;
      case 'storage': return quotas.maxStorageGB;
      case 'apiCalls': return quotas.maxAPICallsPerDay;
      default: return -1;
    }
  }

  private async getCurrentUsage(tenantId: string, type: QuotaType): Promise<number> {
    // In production, this would query actual counts from the database
    const tenantCounters = this.usageCounters.get(tenantId);
    return tenantCounters?.get(type) || 0;
  }

  private getUpgradePlan(currentPlan: string): string | undefined {
    const upgradePath: Record<string, string> = {
      starter: 'professional',
      professional: 'enterprise',
      enterprise: undefined as any,
      custom: undefined as any,
    };
    return upgradePath[currentPlan];
  }
}

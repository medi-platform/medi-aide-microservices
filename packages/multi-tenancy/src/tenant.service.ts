/**
 * Tenant Service
 * Core tenant management operations
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import {
  TenantContext,
  TenantSettings,
  TenantQuotas,
  DEFAULT_TENANT_SETTINGS,
  PLAN_FEATURES,
  PLAN_QUOTAS,
} from './tenant.context';

export interface CreateTenantDto {
  code: string;
  name: string;
  plan?: Tenant['plan'];
  settings?: Partial<TenantSettings>;
  customDomain?: string;
}

export interface UpdateTenantDto {
  name?: string;
  plan?: Tenant['plan'];
  status?: Tenant['status'];
  settings?: Partial<TenantSettings>;
  features?: string[];
  branding?: Tenant['branding'];
  customDomain?: string;
}

@Injectable()
export class TenantService {
  private tenantCache = new Map<string, { context: TenantContext; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Get tenant context by ID or code
   */
  async getTenantContext(tenantIdOrCode: string): Promise<TenantContext | null> {
    // Check cache first
    const cached = this.tenantCache.get(tenantIdOrCode);
    if (cached && cached.expiry > Date.now()) {
      return cached.context;
    }

    // Query database
    const tenant = await this.tenantRepository.findOne({
      where: [
        { id: tenantIdOrCode },
        { code: tenantIdOrCode },
      ],
    });

    if (!tenant) return null;

    const context = this.buildContext(tenant);

    // Cache the result
    this.tenantCache.set(tenantIdOrCode, {
      context,
      expiry: Date.now() + this.CACHE_TTL,
    });
    this.tenantCache.set(tenant.id, {
      context,
      expiry: Date.now() + this.CACHE_TTL,
    });

    return context;
  }

  /**
   * Get tenant by custom domain
   */
  async getTenantByDomain(domain: string): Promise<TenantContext | null> {
    const tenant = await this.tenantRepository.findOne({
      where: { customDomain: domain },
    });

    if (!tenant) return null;

    return this.buildContext(tenant);
  }

  /**
   * Create a new tenant
   */
  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    // Check code availability
    const existing = await this.tenantRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Tenant code already in use');
    }

    const plan = dto.plan || 'trial' as any;
    const tenant = this.tenantRepository.create({
      code: dto.code.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: dto.name,
      plan,
      status: 'trial',
      settings: { ...DEFAULT_TENANT_SETTINGS, ...dto.settings },
      features: PLAN_FEATURES[plan] || [],
      quotas: { ...PLAN_QUOTAS[plan] },
      branding: dto.settings?.branding || DEFAULT_TENANT_SETTINGS.branding,
      customDomain: dto.customDomain,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });

    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.name) tenant.name = dto.name;
    if (dto.status) tenant.status = dto.status;
    if (dto.customDomain !== undefined) tenant.customDomain = dto.customDomain;
    if (dto.branding) tenant.branding = { ...tenant.branding, ...dto.branding };
    if (dto.settings) {
      tenant.settings = { ...tenant.settings, ...dto.settings };
    }

    // Update plan and features
    if (dto.plan && dto.plan !== tenant.plan) {
      tenant.plan = dto.plan;
      tenant.features = PLAN_FEATURES[dto.plan] || tenant.features;
      tenant.quotas = { ...tenant.quotas, ...PLAN_QUOTAS[dto.plan] };
    }

    if (dto.features) {
      tenant.features = dto.features;
    }

    // Invalidate cache
    this.invalidateCache(tenantId);

    return this.tenantRepository.save(tenant);
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * List all tenants (admin only)
   */
  async listTenants(options: {
    page?: number;
    limit?: number;
    status?: Tenant['status'];
    plan?: Tenant['plan'];
  } = {}): Promise<{ data: Tenant[]; total: number }> {
    const { page = 1, limit = 20, status, plan } = options;

    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    if (status) {
      queryBuilder.andWhere('tenant.status = :status', { status });
    }
    if (plan) {
      queryBuilder.andWhere('tenant.plan = :plan', { plan });
    }

    const [data, total] = await queryBuilder
      .orderBy('tenant.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Check if tenant code is available
   */
  async checkCodeAvailability(code: string): Promise<boolean> {
    const normalizedCode = code.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const existing = await this.tenantRepository.findOne({
      where: { code: normalizedCode },
    });
    return !existing;
  }

  /**
   * Suspend a tenant
   */
  async suspendTenant(tenantId: string, reason: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    tenant.status = 'suspended';
    tenant.suspendedAt = new Date();
    tenant.settings = { ...tenant.settings, suspensionReason: reason };

    this.invalidateCache(tenantId);

    return this.tenantRepository.save(tenant);
  }

  /**
   * Activate a tenant
   */
  async activateTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    tenant.status = 'active';
    tenant.suspendedAt = null as any;

    this.invalidateCache(tenantId);

    return this.tenantRepository.save(tenant);
  }

  /**
   * Delete tenant (soft delete by suspending with cancelled status)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    tenant.status = 'cancelled';
    tenant.suspendedAt = new Date();

    this.invalidateCache(tenantId);

    await this.tenantRepository.save(tenant);
  }

  private buildContext(tenant: Tenant): TenantContext {
    return {
      tenantId: tenant.id,
      tenantCode: tenant.code,
      tenantName: tenant.name,
      plan: tenant.plan,
      settings: {
        ...DEFAULT_TENANT_SETTINGS,
        ...tenant.settings,
        branding: { ...DEFAULT_TENANT_SETTINGS.branding, ...tenant.branding },
      },
      features: tenant.features || PLAN_FEATURES[tenant.plan] || [],
      quotas: {
        ...PLAN_QUOTAS[tenant.plan],
        ...tenant.quotas,
        currentUsers: 0,
        currentCaregivers: 0,
        currentPatients: 0,
        currentStorageGB: 0,
      } as TenantQuotas,
    };
  }

  private invalidateCache(tenantId: string): void {
    for (const [key, value] of this.tenantCache.entries()) {
      if (value.context.tenantId === tenantId) {
        this.tenantCache.delete(key);
      }
    }
  }
}

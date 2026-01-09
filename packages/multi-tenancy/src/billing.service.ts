/**
 * Tenant Billing Service
 * Manages subscription billing and invoicing
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan: Tenant['plan'];
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  features: string[];
  quotas: {
    maxUsers: number;
    maxCaregivers: number;
    maxPatients: number;
    maxStorageGB: number;
  };
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'refunded';
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface UsageRecord {
  tenantId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    plan: 'starter',
    monthlyPrice: 99,
    annualPrice: 990,
    currency: 'CAD',
    features: ['Basic scheduling', 'Basic reporting', 'Email support'],
    quotas: { maxUsers: 10, maxCaregivers: 25, maxPatients: 50, maxStorageGB: 5 },
  },
  {
    id: 'professional',
    name: 'Professional',
    plan: 'professional',
    monthlyPrice: 299,
    annualPrice: 2990,
    currency: 'CAD',
    features: [
      'Advanced scheduling',
      'Advanced reporting',
      'EVV',
      'Mobile app',
      'Phone support',
    ],
    quotas: { maxUsers: 50, maxCaregivers: 200, maxPatients: 500, maxStorageGB: 50 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    plan: 'enterprise',
    monthlyPrice: 799,
    annualPrice: 7990,
    currency: 'CAD',
    features: [
      'Custom reporting',
      'API access',
      'SSO',
      'Custom branding',
      'Priority support',
      'Dedicated account manager',
      'HIPAA compliance',
    ],
    quotas: { maxUsers: -1, maxCaregivers: -1, maxPatients: -1, maxStorageGB: 500 },
  },
];

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private tenantService: TenantService,
  ) {}

  /**
   * Get available subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  }

  /**
   * Create subscription for tenant
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    billingCycle: 'monthly' | 'annual',
  ): Promise<{ subscriptionId: string; nextBillingDate: Date }> {
    const tenant = await this.tenantService.getTenant(tenantId);
    const plan = this.getPlan(planId);

    if (!plan) {
      throw new BadRequestException('Invalid plan');
    }

    // In production, this would integrate with Stripe
    const subscriptionId = `sub_${Date.now()}_${tenantId}`;

    // Update tenant
    await this.tenantRepository.update(tenantId, {
      plan: plan.plan,
      status: 'active',
      stripeSubscriptionId: subscriptionId,
      settings: {
        ...tenant.settings,
        billingCycle,
        billingPlanId: planId,
      },
    });

    // Update features and quotas
    await this.tenantService.updateTenant(tenantId, {
      plan: plan.plan,
    });

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(
      nextBillingDate.getMonth() + (billingCycle === 'annual' ? 12 : 1),
    );

    return { subscriptionId, nextBillingDate };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenantId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<{ effectiveDate: Date }> {
    const tenant = await this.tenantService.getTenant(tenantId);

    if (!tenant.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription');
    }

    // In production, this would call Stripe to cancel
    const effectiveDate = cancelAtPeriodEnd
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // End of period
      : new Date();

    if (!cancelAtPeriodEnd) {
      await this.tenantRepository.update(tenantId, {
        status: 'cancelled',
        stripeSubscriptionId: null as any,
      });
    }

    return { effectiveDate };
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    tenantId: string,
    newPlanId: string,
    prorate: boolean = true,
  ): Promise<{ prorationAmount: number }> {
    const tenant = await this.tenantService.getTenant(tenantId);
    const currentPlan = this.getPlan(tenant.plan);
    const newPlan = this.getPlan(newPlanId);

    if (!newPlan) {
      throw new BadRequestException('Invalid plan');
    }

    // Calculate proration (simplified)
    let prorationAmount = 0;
    if (prorate && currentPlan) {
      const daysRemaining = 30; // Simplified
      const dailyDifference =
        (newPlan.monthlyPrice - currentPlan.monthlyPrice) / 30;
      prorationAmount = dailyDifference * daysRemaining;
    }

    // Update tenant plan
    await this.tenantService.updateTenant(tenantId, {
      plan: newPlan.plan,
    });

    return { prorationAmount };
  }

  /**
   * Get billing history
   */
  async getBillingHistory(
    tenantId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ invoices: Invoice[]; total: number }> {
    // In production, this would query from Stripe or local invoice table
    const mockInvoices: Invoice[] = [
      {
        id: 'inv_001',
        tenantId,
        invoiceNumber: 'INV-2024-001',
        amount: 299,
        currency: 'CAD',
        status: 'paid',
        dueDate: new Date('2024-01-01'),
        paidAt: new Date('2024-01-01'),
        items: [
          {
            description: 'Professional Plan - Monthly',
            quantity: 1,
            unitPrice: 299,
            amount: 299,
          },
        ],
      },
    ];

    return { invoices: mockInvoices, total: 1 };
  }

  /**
   * Record usage for metered billing
   */
  async recordUsage(
    tenantId: string,
    metric: string,
    value: number,
  ): Promise<void> {
    // In production, this would:
    // 1. Store the usage record
    // 2. Report to Stripe for metered billing
    // 3. Check against quotas
    console.log(`Usage recorded: ${tenantId} - ${metric}: ${value}`);
  }

  /**
   * Get current usage for tenant
   */
  async getCurrentUsage(
    tenantId: string,
  ): Promise<Record<string, { current: number; limit: number }>> {
    // In production, this would aggregate actual usage
    return {
      users: { current: 15, limit: 50 },
      caregivers: { current: 45, limit: 200 },
      patients: { current: 120, limit: 500 },
      storageGB: { current: 12.5, limit: 50 },
      apiCalls: { current: 5420, limit: 10000 },
    };
  }

  /**
   * Generate invoice
   */
  async generateInvoice(
    tenantId: string,
    items: InvoiceItem[],
  ): Promise<Invoice> {
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      tenantId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now()}`,
      amount: total,
      currency: 'CAD',
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items,
    };

    // In production, save to database and send via email
    return invoice;
  }

  /**
   * Process payment
   */
  async processPayment(
    tenantId: string,
    invoiceId: string,
    paymentMethodId: string,
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // In production, this would process via Stripe
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
    };
  }
}

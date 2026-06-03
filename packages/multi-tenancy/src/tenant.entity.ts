/**
 * Tenant Entity Definition
 * Base entity for multi-tenant data isolation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { getCurrentTenantId, hasTenantContext } from './tenant.context';

/**
 * Tenant entity - represents an organization/agency
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  code!: string; // Short identifier (e.g., 'acme-care')

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: ['starter', 'professional', 'enterprise', 'custom'],
    default: 'starter',
  })
  plan!: 'starter' | 'professional' | 'enterprise' | 'custom';

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'trial', 'cancelled'],
    default: 'trial',
  })
  status!: 'active' | 'suspended' | 'trial' | 'cancelled';

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  features!: string[];

  @Column({ type: 'jsonb', default: {} })
  quotas!: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  branding!: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    companyName?: string;
  };

  @Column({ nullable: true })
  customDomain?: string;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Base entity mixin for tenant-scoped data
 * All tenant-specific entities should extend this
 */
export abstract class TenantScopedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  setTenantId(): void {
    if (!this.tenantId && hasTenantContext()) {
      this.tenantId = getCurrentTenantId();
    }
  }
}

/**
 * Decorator to mark entity as tenant-scoped
 */
export function TenantScoped(): ClassDecorator {
  return (target: Function) => {
    // Add tenantId column metadata
    const existingColumns = Reflect.getMetadata('columns', target) || [];
    Reflect.defineMetadata('columns', [
      ...existingColumns,
      { propertyName: 'tenantId', options: { type: 'uuid' } },
    ], target);

    // Add index metadata
    const existingIndices = Reflect.getMetadata('indices', target) || [];
    Reflect.defineMetadata('indices', [
      ...existingIndices,
      { columns: ['tenantId'] },
    ], target);
  };
}

/**
 * TypeORM subscriber for automatic tenant filtering
 */
export function createTenantSubscriber(connection: any): any {
  return {
    listenTo: () => TenantScopedEntity,

    beforeInsert(event: any): void {
      if (hasTenantContext() && event.entity) {
        event.entity.tenantId = getCurrentTenantId();
      }
    },

    beforeUpdate(event: any): void {
      // Prevent changing tenantId
      if (event.entity && event.databaseEntity) {
        event.entity.tenantId = event.databaseEntity.tenantId;
      }
    },
  };
}

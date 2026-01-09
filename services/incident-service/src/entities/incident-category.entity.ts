import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CategorySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Incident Category Entity
 * Phase 5I: Categorization system for incidents
 */
@Entity('incident_categories')
@Index(['code'], { unique: true })
@Index(['parentId'])
@Index(['isActive'])
export class IncidentCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_fr', type: 'varchar', length: 255, nullable: true })
  nameFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  // Hierarchy
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ type: 'int', default: 0 })
  level!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path?: string; // /root/child/grandchild

  // Configuration
  @Column({ name: 'default_severity', type: 'enum', enum: CategorySeverity, default: CategorySeverity.MEDIUM })
  defaultSeverity!: CategorySeverity;

  @Column({ name: 'requires_investigation', type: 'boolean', default: false })
  requiresInvestigation!: boolean;

  @Column({ name: 'requires_notification', type: 'boolean', default: false })
  requiresNotification!: boolean;

  @Column({ name: 'notification_recipients', type: 'simple-array', nullable: true })
  notificationRecipients?: string[]; // roles or user IDs

  @Column({ name: 'response_time_hours', type: 'int', nullable: true })
  responseTimeHours?: number;

  @Column({ name: 'resolution_time_hours', type: 'int', nullable: true })
  resolutionTimeHours?: number;

  // Regulatory
  @Column({ name: 'reportable_to_authorities', type: 'boolean', default: false })
  reportableToAuthorities!: boolean;

  @Column({ name: 'regulatory_reference', type: 'varchar', length: 255, nullable: true })
  regulatoryReference?: string;

  // Status
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

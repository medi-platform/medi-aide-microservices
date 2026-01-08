import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ContractType } from './contract.entity';

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

@Entity('contract_templates')
@Index(['key'], { unique: true })
@Index(['type', 'status'])
export class ContractTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string; // e.g., 'standard-care-v1', 'respite-care-v1'

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ContractType })
  type!: ContractType;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status!: TemplateStatus;

  @Column({ type: 'varchar', length: 120, default: 'US' })
  jurisdiction!: string; // e.g., 'US-CA', 'CA-ON'

  @Column({ name: 'default_locale', type: 'varchar', length: 10, default: 'en' })
  defaultLocale!: string;

  // Template content (HTML/Markdown with placeholders)
  @Column({ type: 'text' })
  content!: string;

  // Required signature roles
  @Column({ name: 'required_signatures', type: 'simple-array' })
  requiredSignatures!: string[]; // ['patient', 'caregiver', 'guardian']

  // Placeholders available in the template
  @Column({ type: 'jsonb', nullable: true })
  placeholders?: {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }[];

  // Default terms
  @Column({ name: 'default_terms', type: 'jsonb', nullable: true })
  defaultTerms?: Record<string, any>;

  // Version tracking
  @Column({ name: 'current_version', type: 'int', default: 1 })
  currentVersion!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


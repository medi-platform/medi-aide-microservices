import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MessageType } from '../interfaces/communication.interface';

export enum TemplateCategory {
  GREETING = 'greeting',
  CARE_UPDATE = 'care_update',
  SHIFT_REMINDER = 'shift_reminder',
  VISIT_SUMMARY = 'visit_summary',
  MEDICATION_REMINDER = 'medication_reminder',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  EMERGENCY = 'emergency',
  GENERAL = 'general',
}

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Message Template Entity
 * Phase 5F: Reusable message templates for quick responses
 */
@Entity('message_templates')
@Index(['ownerId', 'status'])
@Index(['category', 'status'])
@Index(['isSystem', 'status'])
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId?: string; // null for system templates

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TemplateCategory, default: TemplateCategory.GENERAL })
  category!: TemplateCategory;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status!: TemplateStatus;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  messageType!: MessageType;

  // Template content (supports placeholders like {{patient_name}})
  @Column({ type: 'text' })
  content!: string;

  // French content for bilingual support
  @Column({ name: 'content_fr', type: 'text', nullable: true })
  contentFr?: string;

  // Available placeholders
  @Column({ type: 'jsonb', nullable: true })
  placeholders?: {
    key: string;
    label: string;
    description?: string;
    defaultValue?: string;
    required?: boolean;
  }[];

  // Shortcut for quick access (e.g., "/hello", "/thanks")
  @Column({ type: 'varchar', length: 50, nullable: true })
  shortcut?: string;

  // Usage tracking
  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  // Attachments template
  @Column({ name: 'attachment_templates', type: 'jsonb', nullable: true })
  attachmentTemplates?: {
    type: string;
    url: string;
    fileName: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

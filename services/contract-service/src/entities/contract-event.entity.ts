import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ContractEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  SIGNATURE_REQUESTED = 'signature_requested',
  SIGNATURE_REMINDER_SENT = 'signature_reminder_sent',
  SIGNED = 'signed',
  DECLINED = 'declined',
  FULLY_SIGNED = 'fully_signed',
  ACTIVATED = 'activated',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  DOCUMENT_GENERATED = 'document_generated',
  DOCUMENT_VIEWED = 'document_viewed',
  DOCUMENT_DOWNLOADED = 'document_downloaded',
}

@Entity('contract_events')
@Index(['contractId', 'createdAt'])
@Index(['eventType'])
export class ContractEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId!: string;

  @Column({ name: 'event_type', type: 'enum', enum: ContractEventType })
  eventType!: ContractEventType;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId?: string;

  @Column({ name: 'actor_role', nullable: true })
  actorRole?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Audit trail data
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  // Changes tracking
  @Column({ type: 'jsonb', nullable: true })
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // For immutable audit trail
  @Column({ name: 'event_hash', type: 'text', nullable: true })
  eventHash?: string;

  @Column({ name: 'previous_event_hash', type: 'text', nullable: true })
  previousEventHash?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


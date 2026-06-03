/**
 * Policy Acknowledgment Entity
 * Tracks policy acknowledgments by staff and guardians
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum AcknowledgerType {
  STAFF = 'staff',
  GUARDIAN = 'guardian',
  RESIDENT = 'resident',
}

export enum AcknowledgmentStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  EXPIRED = 'expired',
  SUPERSEDED = 'superseded',
}

@Entity({ name: 'policy_acknowledgments' })
@Index(['residence_id'])
@Index(['policy_id'])
@Index(['acknowledger_id'])
@Index(['status'])
@Index(['due_date'])
@Unique(['policy_id', 'policy_version', 'acknowledger_id'])
export class PolicyAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  policy_id!: string;

  @Column({ type: 'varchar', length: 255 })
  policy_name!: string;

  @Column({ type: 'varchar', length: 50 })
  policy_version!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policy_category?: string;

  @Column({ type: 'uuid' })
  acknowledger_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  acknowledger_name?: string;

  @Column({ type: 'varchar', length: 20, default: AcknowledgerType.STAFF })
  acknowledger_type!: AcknowledgerType;

  @Column({ type: 'varchar', length: 20, default: AcknowledgmentStatus.PENDING })
  status!: AcknowledgmentStatus;

  // Timing
  @Column({ type: 'date', nullable: true })
  due_date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledged_at?: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  // Acknowledgment Method
  @Column({ type: 'varchar', length: 50, nullable: true })
  acknowledgment_method?: string; // electronic, in_person, paper

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip_address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent?: string;

  // Verification
  @Column({ type: 'boolean', default: false })
  quiz_required!: boolean;

  @Column({ type: 'boolean', default: false })
  quiz_passed!: boolean;

  @Column({ type: 'int', nullable: true })
  quiz_score?: number;

  @Column({ type: 'int', nullable: true })
  quiz_passing_score?: number;

  // Witness (for paper acknowledgments)
  @Column({ type: 'uuid', nullable: true })
  witnessed_by?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  witness_name?: string;

  // Document Reference
  @Column({ type: 'uuid', nullable: true })
  policy_document_file_id?: string;

  @Column({ type: 'uuid', nullable: true })
  signed_document_file_id?: string;

  // Reminder Tracking
  @Column({ type: 'int', default: 0 })
  reminder_count!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_reminder_sent_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  next_reminder_at?: Date;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

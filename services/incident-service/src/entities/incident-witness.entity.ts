import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WitnessType {
  STAFF = 'staff',
  PATIENT = 'patient',
  FAMILY = 'family',
  VISITOR = 'visitor',
  OTHER = 'other',
}

export enum StatementStatus {
  PENDING = 'pending',
  REQUESTED = 'requested',
  RECEIVED = 'received',
  DECLINED = 'declined',
}

/**
 * Incident Witness Entity
 * Phase 5I: Tracks witnesses to incidents
 */
@Entity('incident_witnesses')
@Index(['incidentId'])
@Index(['userId'])
@Index(['statementStatus'])
export class IncidentWitness {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId!: string;

  // Witness identification
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string; // if registered user

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: WitnessType })
  witnessType!: WitnessType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relationship?: string; // e.g., "RN on duty", "Patient's daughter"

  // Statement
  @Column({ name: 'statement_status', type: 'enum', enum: StatementStatus, default: StatementStatus.PENDING })
  statementStatus!: StatementStatus;

  @Column({ type: 'text', nullable: true })
  statement?: string;

  @Column({ name: 'statement_date', type: 'timestamptz', nullable: true })
  statementDate?: Date;

  @Column({ name: 'statement_taken_by', type: 'uuid', nullable: true })
  statementTakenBy?: string;

  // Contact attempts
  @Column({ name: 'contact_attempts', type: 'jsonb', nullable: true })
  contactAttempts?: {
    date: Date;
    method: 'phone' | 'email' | 'in_person';
    outcome: 'reached' | 'no_answer' | 'left_message';
    notes?: string;
  }[];

  // Consent
  @Column({ name: 'consent_given', type: 'boolean', default: false })
  consentGiven!: boolean;

  @Column({ name: 'consent_date', type: 'timestamptz', nullable: true })
  consentDate?: Date;

  @Column({ name: 'anonymous_requested', type: 'boolean', default: false })
  anonymousRequested!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

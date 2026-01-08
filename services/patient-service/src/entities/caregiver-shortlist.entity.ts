import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ShortlistStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
  BLOCKED = 'blocked',
}

@Entity('patient_caregiver_shortlists')
@Index(['patientId', 'caregiverId'], { unique: true })
@Index(['patientId', 'status'])
export class CaregiverShortlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  caregiverId!: string;

  @Column({ type: 'enum', enum: ShortlistStatus, default: ShortlistStatus.ACTIVE })
  status!: ShortlistStatus;

  // Preference ranking (1 = most preferred)
  @Column({ type: 'int', nullable: true })
  rank?: number;

  // Notes about why this caregiver is shortlisted
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Rating given by patient
  @Column({ type: 'int', nullable: true })
  rating?: number;

  // Last interaction
  @Column({ name: 'last_visit_date', type: 'date', nullable: true })
  lastVisitDate?: Date;

  @Column({ name: 'total_visits', type: 'int', default: 0 })
  totalVisits!: number;

  // Block reason if status is BLOCKED
  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason?: string;

  @Column({ name: 'blocked_at', type: 'timestamptz', nullable: true })
  blockedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


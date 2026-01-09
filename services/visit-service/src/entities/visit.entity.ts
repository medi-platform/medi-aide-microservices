import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VisitStatus, VisitType, CancellationReason } from '../interfaces/visit.interface';

/**
 * Visit Entity
 * Core entity representing a caregiver visit to a patient
 */
@Entity('visits')
@Index(['caregiverId', 'scheduledStart'])
@Index(['patientId', 'scheduledStart'])
@Index(['status', 'scheduledStart'])
@Index(['agencyId', 'scheduledStart'])
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  caregiverId!: string;

  @Column({ type: 'uuid' })
  @Index()
  patientId!: string;

  @Column({ type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ type: 'uuid', nullable: true })
  scheduleId?: string;

  @Column({ type: 'uuid', nullable: true })
  carePlanId?: string;

  @Column({
    type: 'enum',
    enum: VisitType,
    default: VisitType.REGULAR,
  })
  visitType!: VisitType;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.SCHEDULED,
  })
  status!: VisitStatus;

  @Column({ type: 'timestamptz' })
  scheduledStart!: Date;

  @Column({ type: 'timestamptz' })
  scheduledEnd!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualStart?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualEnd?: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'jsonb', default: [] })
  tasks!: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    isRequired: boolean;
    completedAt?: string;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  notes!: Array<{
    id: string;
    type: string;
    content: string;
    createdBy: string;
    createdAt: string;
    isPrivate: boolean;
  }>;

  @Column({ type: 'jsonb', default: [] })
  attachments!: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;

  @Column({
    type: 'enum',
    enum: CancellationReason,
    nullable: true,
  })
  cancellationReason?: CancellationReason;

  @Column({ type: 'text', nullable: true })
  cancellationNotes?: string;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  rescheduledFromId?: string;

  @Column({ type: 'uuid', nullable: true })
  rescheduledToId?: string;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recurrencePattern?: string;

  @Column({ type: 'boolean', default: false })
  requiresEvv!: boolean;

  @Column({ type: 'uuid', nullable: true })
  evvVerificationId?: string;

  @Column({ type: 'boolean', default: false })
  isConfirmed!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'int', nullable: true })
  caregiverRating?: number;

  @Column({ type: 'int', nullable: true })
  patientSatisfaction?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Vacation/PTO request status
 */
export enum VacationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Time off request type
 */
export enum TimeOffType {
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  PERSONAL = 'personal',
  BEREAVEMENT = 'bereavement',
  JURY_DUTY = 'jury_duty',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  UNPAID = 'unpaid',
  OTHER = 'other',
}

/**
 * Entity representing a caregiver's vacation/PTO request.
 * Tracks time-off requests and approvals.
 */
@Entity('caregiver_vacations')
@Index(['caregiverId', 'status'])
@Index(['startDate', 'endDate'])
export class CaregiverVacation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({
    type: 'enum',
    enum: TimeOffType,
    default: TimeOffType.VACATION,
    name: 'time_off_type',
  })
  timeOffType: TimeOffType;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'total_days' })
  totalDays: number;

  @Column({ type: 'boolean', name: 'is_half_day', default: false })
  isHalfDay: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: VacationRequestStatus,
    default: VacationRequestStatus.PENDING,
  })
  status: VacationRequestStatus;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp with time zone', name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'boolean', name: 'is_paid', default: true })
  isPaid: boolean;

  @Column({ type: 'uuid', name: 'supporting_document_id', nullable: true })
  supportingDocumentId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

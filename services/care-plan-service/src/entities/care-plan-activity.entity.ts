import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ActivityStatus {
  NOT_STARTED = 'not-started',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in-progress',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  STOPPED = 'stopped',
  UNKNOWN = 'unknown',
  ENTERED_IN_ERROR = 'entered-in-error',
}

export enum ActivityKind {
  APPOINTMENT = 'Appointment',
  COMMUNICATION_REQUEST = 'CommunicationRequest',
  DEVICE_REQUEST = 'DeviceRequest',
  MEDICATION_REQUEST = 'MedicationRequest',
  NUTRITION_ORDER = 'NutritionOrder',
  SERVICE_REQUEST = 'ServiceRequest',
  PROCEDURE = 'Procedure',
  OBSERVATION = 'Observation',
  TASK = 'Task',
}

@Entity('care_plan_activities')
@Index(['carePlanId', 'status'])
@Index(['goalId'])
@Index(['assignedTo', 'status'])
export class CarePlanActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'care_plan_id', type: 'uuid' })
  carePlanId!: string;

  @Column({ name: 'goal_id', type: 'uuid', nullable: true })
  goalId?: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  // FHIR: CarePlan.activity.detail.kind
  @Column({ type: 'enum', enum: ActivityKind, default: ActivityKind.TASK })
  kind!: ActivityKind;

  // FHIR: CarePlan.activity.detail.code
  @Column({ nullable: true })
  code?: string;

  // FHIR: CarePlan.activity.detail.description
  @Column({ type: 'text' })
  description!: string;

  // FHIR: CarePlan.activity.detail.status
  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.NOT_STARTED })
  status!: ActivityStatus;

  // FHIR: CarePlan.activity.detail.statusReason
  @Column({ name: 'status_reason', nullable: true })
  statusReason?: string;

  // FHIR: CarePlan.activity.detail.scheduledTiming
  @Column({ type: 'jsonb', nullable: true })
  schedule?: {
    frequency: number;
    period: number;
    periodUnit: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
    dayOfWeek?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    timeOfDay?: string[];
  };

  // FHIR: CarePlan.activity.detail.scheduledPeriod
  @Column({ name: 'scheduled_start', type: 'timestamptz', nullable: true })
  scheduledStart?: Date;

  @Column({ name: 'scheduled_end', type: 'timestamptz', nullable: true })
  scheduledEnd?: Date;

  // FHIR: CarePlan.activity.detail.performer
  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ name: 'assigned_role', nullable: true })
  assignedRole?: string;

  // FHIR: CarePlan.activity.detail.location
  @Column({ nullable: true })
  location?: string;

  // Instructions for the activity
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  // Completion tracking
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'completed_by', type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ name: 'completion_notes', type: 'text', nullable: true })
  completionNotes?: string;

  // Duration in minutes
  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GoalStatus {
  PROPOSED = 'proposed',
  PLANNED = 'planned',
  ACCEPTED = 'accepted',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  REJECTED = 'rejected',
}

export enum GoalPriority {
  HIGH = 'high-priority',
  MEDIUM = 'medium-priority',
  LOW = 'low-priority',
}

export enum GoalCategory {
  BEHAVIORAL = 'behavioral',
  NURSING = 'nursing',
  PHYSIOTHERAPY = 'physiotherapy',
  DIETARY = 'dietary',
  SAFETY = 'safety',
  SOCIAL = 'social',
  COGNITIVE = 'cognitive',
  ADL = 'adl', // Activities of Daily Living
  IADL = 'iadl', // Instrumental Activities of Daily Living
  MEDICATION = 'medication',
  PAIN_MANAGEMENT = 'pain_management',
}

@Entity('care_plan_goals')
@Index(['carePlanId', 'status'])
@Index(['patientId', 'status'])
export class CarePlanGoal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'care_plan_id', type: 'uuid' })
  carePlanId!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  // FHIR: Goal.description
  @Column()
  description!: string;

  // FHIR: Goal.lifecycleStatus
  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.PROPOSED })
  status!: GoalStatus;

  // FHIR: Goal.priority
  @Column({ type: 'enum', enum: GoalPriority, default: GoalPriority.MEDIUM })
  priority!: GoalPriority;

  // FHIR: Goal.category
  @Column({ type: 'enum', enum: GoalCategory, nullable: true })
  category?: GoalCategory;

  // FHIR: Goal.startDate
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  // FHIR: Goal.target.dueDate
  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: Date;

  // FHIR: Goal.achievementStatus
  @Column({ name: 'achievement_status', nullable: true })
  achievementStatus?: 'in-progress' | 'improving' | 'worsening' | 'no-change' | 'achieved' | 'sustaining' | 'not-achieved' | 'not-attainable';

  // FHIR: Goal.target.measure (quantifiable target)
  @Column({ type: 'jsonb', nullable: true })
  target?: {
    measure: string;
    detailQuantity?: { value: number; unit: string };
    detailRange?: { low: number; high: number; unit: string };
    detailString?: string;
  };

  // FHIR: Goal.outcome
  @Column({ type: 'jsonb', nullable: true })
  outcomes?: {
    date: Date;
    value: number | string;
    notes?: string;
  }[];

  // Progress tracking
  @Column({ name: 'progress_percentage', type: 'int', default: 0 })
  progressPercentage!: number;

  @Column({ name: 'progress_notes', type: 'text', nullable: true })
  progressNotes?: string;

  // FHIR: Goal.expressedBy
  @Column({ name: 'expressed_by', type: 'uuid', nullable: true })
  expressedBy?: string;

  // FHIR: Goal.addresses (conditions/concerns this goal addresses)
  @Column({ type: 'simple-array', nullable: true })
  addresses?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


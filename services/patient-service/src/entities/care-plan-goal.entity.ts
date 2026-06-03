import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

/**
 * Goal priority levels
 */
export enum CarePlanGoalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Goal status tracking
 */
export enum CarePlanGoalStatus {
  ACTIVE = 'active',
  ACHIEVED = 'achieved',
  PARTIALLY_MET = 'partially_met',
  NOT_MET = 'not_met',
  REVISED = 'revised',
  DISCONTINUED = 'discontinued',
}

/**
 * Goal category/domain
 */
export enum CarePlanGoalCategory {
  PHYSICAL = 'physical',
  COGNITIVE = 'cognitive',
  EMOTIONAL = 'emotional',
  SOCIAL = 'social',
  NUTRITIONAL = 'nutritional',
  SAFETY = 'safety',
  SELF_CARE = 'self_care',
  MEDICATION = 'medication',
  PAIN_MANAGEMENT = 'pain_management',
  COMMUNICATION = 'communication',
  MOBILITY = 'mobility',
  SKIN_INTEGRITY = 'skin_integrity',
  ELIMINATION = 'elimination',
  RESPIRATORY = 'respiratory',
  OTHER = 'other',
}

/**
 * Entity representing a care plan goal for a patient.
 * Tracks clinical objectives and interventions.
 */
@Entity('care_plan_goals')
@Index(['patientId', 'status'])
@Index(['carePlanId'])
export class CarePlanGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'uuid', name: 'care_plan_id', nullable: true })
  carePlanId: string;

  @Column({
    type: 'enum',
    enum: CarePlanGoalCategory,
    default: CarePlanGoalCategory.OTHER,
  })
  category: CarePlanGoalCategory;

  @Column({
    type: 'enum',
    enum: CarePlanGoalPriority,
    default: CarePlanGoalPriority.MEDIUM,
  })
  priority: CarePlanGoalPriority;

  @Column({
    type: 'enum',
    enum: CarePlanGoalStatus,
    default: CarePlanGoalStatus.ACTIVE,
  })
  status: CarePlanGoalStatus;

  @Column({ type: 'varchar', length: 500, name: 'goal_statement' })
  goalStatement: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'measurable_outcome', nullable: true })
  measurableOutcome: string; // How success will be measured

  @Column({ type: 'text', name: 'baseline_status', nullable: true })
  baselineStatus: string; // Starting point

  @Column({ type: 'date', name: 'target_date', nullable: true })
  targetDate: Date;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'achieved_date', nullable: true })
  achievedDate: Date;

  // Interventions (actions to achieve goal)
  @Column({
    type: 'jsonb',
    default: [],
  })
  interventions: Array<{
    description: string;
    frequency: string;
    responsible: string;
    notes?: string;
  }>;

  // Progress tracking
  @Column({ type: 'int', name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  @Column({
    type: 'jsonb',
    default: [],
    name: 'progress_notes',
  })
  progressNotes: Array<{
    date: string;
    note: string;
    authorId: string;
    authorName: string;
  }>;

  @Column({ type: 'date', name: 'last_evaluated', nullable: true })
  lastEvaluated: Date;

  @Column({ type: 'text', name: 'last_evaluation_note', nullable: true })
  lastEvaluationNote: string;

  // Related diagnosis
  @Column({ type: 'uuid', name: 'diagnosis_id', nullable: true })
  diagnosisId: string;

  @Column({ type: 'varchar', length: 255, name: 'related_diagnosis', nullable: true })
  relatedDiagnosis: string;

  // Author
  @Column({ type: 'uuid', name: 'created_by_id' })
  createdById: string;

  @Column({ type: 'varchar', length: 255, name: 'created_by_name' })
  createdByName: string;

  @Column({ type: 'text', name: 'revision_reason', nullable: true })
  revisionReason: string;

  @Column({ type: 'uuid', name: 'previous_goal_id', nullable: true })
  previousGoalId: string; // If revised from another goal

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

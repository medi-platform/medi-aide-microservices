import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CarePlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  REVOKED = 'revoked',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

export enum CarePlanIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  ORDER = 'order',
  OPTION = 'option',
  DIRECTIVE = 'directive',
}

export enum CarePlanCategory {
  ASSESS_PLAN = 'assess-plan',
  HOME_HEALTH = 'home-health',
  NURSING = 'nursing',
  MENTAL_HEALTH = 'mental-health',
  PHYSICAL_THERAPY = 'physical-therapy',
  OCCUPATIONAL_THERAPY = 'occupational-therapy',
  SPEECH_THERAPY = 'speech-therapy',
  WELLNESS = 'wellness',
  CHRONIC_CARE = 'chronic-care',
  PALLIATIVE = 'palliative',
  HOSPICE = 'hospice',
}

@Entity('care_plans')
@Index(['patientId', 'status'])
@Index(['status', 'createdAt'])
export class CarePlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // FHIR: CarePlan.subject
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  // FHIR: CarePlan.title
  @Column({ type: 'varchar' })
  title!: string;

  // FHIR: CarePlan.description
  @Column({ type: 'text' })
  description!: string;

  // FHIR: CarePlan.status
  @Column({ type: 'enum', enum: CarePlanStatus, default: CarePlanStatus.DRAFT })
  status!: CarePlanStatus;

  // FHIR: CarePlan.intent
  @Column({ type: 'enum', enum: CarePlanIntent, default: CarePlanIntent.PLAN })
  intent!: CarePlanIntent;

  // FHIR: CarePlan.category
  @Column({ type: 'enum', enum: CarePlanCategory, nullable: true })
  category?: CarePlanCategory;

  // FHIR: CarePlan.period
  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart?: Date;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd?: Date;

  // FHIR: CarePlan.author
  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId?: string;

  // FHIR: CarePlan.contributor
  @Column({ name: 'contributor_ids', type: 'simple-array', nullable: true })
  contributorIds?: string[];

  // Legacy: goals stored as JSON (for backward compatibility)
  @Column({ type: 'jsonb', nullable: true })
  goals?: any[];

  // Legacy: interventions stored as JSON (for backward compatibility)
  @Column({ type: 'jsonb', nullable: true })
  interventions?: any[];

  // FHIR: CarePlan.addresses (conditions this plan addresses)
  @Column({ type: 'simple-array', nullable: true })
  addresses?: string[];

  // FHIR: CarePlan.supportingInfo
  @Column({ name: 'supporting_info', type: 'jsonb', nullable: true })
  supportingInfo?: {
    type: string;
    reference: string;
    display?: string;
  }[];

  // Version control
  @Column({ type: 'int', default: 1 })
  version!: number;

  // Approval tracking
  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  // FHIR Resource ID (for interoperability)
  @Column({ name: 'fhir_id', nullable: true })
  fhirId?: string;

  // Last synced with external FHIR server
  @Column({ name: 'fhir_last_synced', type: 'timestamptz', nullable: true })
  fhirLastSynced?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

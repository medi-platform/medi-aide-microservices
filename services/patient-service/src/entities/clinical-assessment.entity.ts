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
 * Assessment type classification
 */
export enum ClinicalAssessmentType {
  INITIAL = 'initial',
  ADMISSION = 'admission',
  DAILY = 'daily',
  SHIFT = 'shift',
  DISCHARGE = 'discharge',
  FALL_RISK = 'fall_risk',
  PAIN = 'pain',
  SKIN = 'skin',
  NUTRITION = 'nutrition',
  MOBILITY = 'mobility',
  COGNITIVE = 'cognitive',
  WOUND = 'wound',
  MEDICATION_RECONCILIATION = 'medication_reconciliation',
  HEAD_TO_TOE = 'head_to_toe',
  FOCUSED = 'focused',
  OTHER = 'other',
}

/**
 * Assessment status
 */
export enum ClinicalAssessmentStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  VOIDED = 'voided',
}

/**
 * Entity representing a clinical assessment.
 * Supports standardized assessments like Braden, Morse, MoCA, etc.
 */
@Entity('clinical_assessments')
@Index(['patientId', 'assessmentType'])
@Index(['assessorId', 'assessmentDate'])
export class ClinicalAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'uuid', name: 'visit_id', nullable: true })
  visitId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({
    type: 'enum',
    enum: ClinicalAssessmentType,
    name: 'assessment_type',
  })
  assessmentType: ClinicalAssessmentType;

  @Column({ type: 'varchar', length: 255, name: 'assessment_name' })
  assessmentName: string;

  @Column({ type: 'varchar', length: 100, name: 'assessment_tool', nullable: true })
  assessmentTool: string; // e.g., Braden Scale, Morse Fall Scale, MoCA

  @Column({
    type: 'enum',
    enum: ClinicalAssessmentStatus,
    default: ClinicalAssessmentStatus.IN_PROGRESS,
  })
  status: ClinicalAssessmentStatus;

  @Column({ type: 'timestamp with time zone', name: 'assessment_date' })
  assessmentDate: Date;

  // Assessor information
  @Column({ type: 'uuid', name: 'assessor_id' })
  assessorId: string;

  @Column({ type: 'varchar', length: 255, name: 'assessor_name' })
  assessorName: string;

  @Column({ type: 'varchar', length: 100, name: 'assessor_credentials', nullable: true })
  assessorCredentials: string;

  // Score-based assessments
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_score', nullable: true })
  totalScore: number;

  @Column({ type: 'varchar', length: 100, name: 'risk_level', nullable: true })
  riskLevel: string; // low, moderate, high, etc.

  @Column({
    type: 'jsonb',
    default: {},
    name: 'score_breakdown',
  })
  scoreBreakdown: Record<string, any>; // Individual component scores

  // System-based assessment (Head-to-Toe)
  @Column({ type: 'jsonb', default: {}, name: 'systems_assessment' })
  systemsAssessment: {
    neurological?: { findings: string; wdl: boolean };
    cardiovascular?: { findings: string; wdl: boolean };
    respiratory?: { findings: string; wdl: boolean };
    gastrointestinal?: { findings: string; wdl: boolean };
    genitourinary?: { findings: string; wdl: boolean };
    musculoskeletal?: { findings: string; wdl: boolean };
    integumentary?: { findings: string; wdl: boolean };
    psychosocial?: { findings: string; wdl: boolean };
    pain?: { level: number; location: string; quality: string };
  };

  // Fall Risk Assessment (Morse Scale components)
  @Column({ type: 'jsonb', default: {}, name: 'fall_risk_data' })
  fallRiskData: {
    historyOfFalling?: number;
    secondaryDiagnosis?: number;
    ambulatoryAid?: number;
    ivTherapy?: number;
    gait?: number;
    mentalStatus?: number;
  };

  // Skin Assessment (Braden Scale components)
  @Column({ type: 'jsonb', default: {}, name: 'skin_assessment_data' })
  skinAssessmentData: {
    sensoryPerception?: number;
    moisture?: number;
    activity?: number;
    mobility?: number;
    nutrition?: number;
    frictionShear?: number;
    woundsPresent?: boolean;
    woundDetails?: string;
  };

  // Nutrition Assessment
  @Column({ type: 'jsonb', default: {}, name: 'nutrition_data' })
  nutritionData: {
    dietType?: string;
    restrictions?: string[];
    appetiteLevel?: string;
    weightChange?: string;
    swallowingDifficulty?: boolean;
    assistanceNeeded?: string;
  };

  // Cognitive Assessment
  @Column({ type: 'jsonb', default: {}, name: 'cognitive_data' })
  cognitiveData: {
    orientedTo?: string[]; // person, place, time, situation
    memory?: string;
    attention?: string;
    judgment?: string;
    mood?: string;
    behavior?: string;
  };

  // Additional findings
  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'text', name: 'care_plan_updates', nullable: true })
  carePlanUpdates: string;

  @Column({ type: 'jsonb', default: [], name: 'interventions_triggered' })
  interventionsTriggered: string[];

  // Review
  @Column({ type: 'uuid', name: 'reviewed_by_id', nullable: true })
  reviewedById: string;

  @Column({ type: 'timestamp with time zone', name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'date', name: 'next_assessment_due', nullable: true })
  nextAssessmentDue: Date;

  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

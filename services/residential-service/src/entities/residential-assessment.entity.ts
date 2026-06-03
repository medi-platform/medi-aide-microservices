/**
 * Residential Assessment Entity
 * Resident assessments (admission, quarterly, annual, RAI-MDS, etc.)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AssessmentType, AssessmentStatus } from '../interfaces/residential.interface';

@Entity({ name: 'residential_assessments' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['assessment_type'])
@Index(['status'])
@Index(['assessment_date'])
export class ResidentialAssessment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'varchar', length: 50, default: AssessmentType.QUARTERLY })
  assessment_type!: AssessmentType;

  @Column({ type: 'varchar', length: 20, default: AssessmentStatus.DRAFT })
  status!: AssessmentStatus;

  @Column({ type: 'date' })
  assessment_date!: Date;

  @Column({ type: 'date', nullable: true })
  due_date?: Date;

  // Assessor Information
  @Column({ type: 'uuid' })
  assessor_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assessor_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assessor_credentials?: string;

  // Assessment Sections (flexible structure)
  @Column({ type: 'jsonb', nullable: true })
  cognitive_section?: {
    score?: number;
    notes?: string;
    concerns?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  physical_section?: {
    mobilityScore?: number;
    adlScore?: number;
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  behavioral_section?: {
    score?: number;
    behaviors?: string[];
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  social_section?: {
    participationLevel?: string;
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  nutritional_section?: {
    weight?: number;
    bmi?: number;
    dietaryNeeds?: string[];
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  skin_integrity_section?: {
    issues?: Array<{
      location: string;
      type: string;
      stage?: number;
    }>;
    notes?: string;
  };

  // Overall Assessment
  @Column({ type: 'varchar', length: 50, nullable: true })
  overall_care_level?: string;

  @Column({ type: 'jsonb', default: [] })
  identified_risks!: Array<{
    riskType: string;
    severity: string;
    mitigationPlan: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  recommendations!: Array<{
    category: string;
    recommendation: string;
    priority: string;
  }>;

  @Column({ type: 'text', nullable: true })
  summary_notes?: string;

  // Care Plan Updates
  @Column({ type: 'boolean', default: false })
  care_plan_updated!: boolean;

  @Column({ type: 'uuid', nullable: true })
  care_plan_id?: string;

  // Review & Approval
  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'text', nullable: true })
  review_comments?: string;

  // Family Communication
  @Column({ type: 'boolean', default: false })
  family_notified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  family_notified_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  family_meeting_id?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

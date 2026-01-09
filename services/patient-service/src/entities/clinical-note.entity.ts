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
 * Clinical note type classification
 */
export enum ClinicalNoteType {
  PROGRESS_NOTE = 'progress_note',
  NURSING_NOTE = 'nursing_note',
  ASSESSMENT = 'assessment',
  CARE_PLAN = 'care_plan',
  DISCHARGE_SUMMARY = 'discharge_summary',
  TRANSFER_NOTE = 'transfer_note',
  PROCEDURE_NOTE = 'procedure_note',
  CONSULTATION = 'consultation',
  INCIDENT_REPORT = 'incident_report',
  COMMUNICATION = 'communication',
  OTHER = 'other',
}

/**
 * Note status
 */
export enum ClinicalNoteStatus {
  DRAFT = 'draft',
  FINAL = 'final',
  AMENDED = 'amended',
  ADDENDUM = 'addendum',
  VOIDED = 'voided',
}

/**
 * Entity representing clinical documentation notes.
 * Supports various documentation formats including DAR, SOAP, and narrative.
 */
@Entity('clinical_notes')
@Index(['patientId', 'noteType'])
@Index(['authorId', 'noteDate'])
export class ClinicalNote {
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
    enum: ClinicalNoteType,
    default: ClinicalNoteType.PROGRESS_NOTE,
    name: 'note_type',
  })
  noteType: ClinicalNoteType;

  @Column({
    type: 'enum',
    enum: ClinicalNoteStatus,
    default: ClinicalNoteStatus.FINAL,
  })
  status: ClinicalNoteStatus;

  @Column({ type: 'timestamp with time zone', name: 'note_date' })
  noteDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  // SOAP format fields
  @Column({ type: 'text', nullable: true })
  subjective: string; // Patient's complaints/symptoms

  @Column({ type: 'text', nullable: true })
  objective: string; // Observable, measurable data

  @Column({ type: 'text', nullable: true })
  assessment: string; // Clinical assessment/diagnosis

  @Column({ type: 'text', name: 'plan', nullable: true })
  plan: string; // Treatment plan

  // DAR (Focus Charting) format fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  focus: string; // Focus/problem

  @Column({ type: 'text', name: 'dar_data', nullable: true })
  darData: string; // Data (subjective + objective)

  @Column({ type: 'text', name: 'dar_action', nullable: true })
  darAction: string; // Action taken

  @Column({ type: 'text', name: 'dar_response', nullable: true })
  darResponse: string; // Patient response

  // Narrative format
  @Column({ type: 'text', nullable: true })
  narrative: string;

  // Author information
  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'varchar', length: 255, name: 'author_name' })
  authorName: string;

  @Column({ type: 'varchar', length: 100, name: 'author_credentials', nullable: true })
  authorCredentials: string; // RN, RPN, PSW, etc.

  @Column({ type: 'timestamp with time zone', name: 'signed_at', nullable: true })
  signedAt: Date;

  // Cosign (for students, new grads, etc.)
  @Column({ type: 'uuid', name: 'cosigner_id', nullable: true })
  cosignerId: string;

  @Column({ type: 'varchar', length: 255, name: 'cosigner_name', nullable: true })
  cosignerName: string;

  @Column({ type: 'timestamp with time zone', name: 'cosigned_at', nullable: true })
  cosignedAt: Date;

  @Column({ type: 'boolean', name: 'requires_cosign', default: false })
  requiresCosign: boolean;

  // Amendment/Addendum
  @Column({ type: 'uuid', name: 'parent_note_id', nullable: true })
  parentNoteId: string; // For addendums

  @Column({ type: 'text', name: 'amendment_reason', nullable: true })
  amendmentReason: string;

  @Column({ type: 'timestamp with time zone', name: 'amended_at', nullable: true })
  amendedAt: Date;

  @Column({ type: 'uuid', name: 'amended_by_id', nullable: true })
  amendedById: string;

  // Visibility
  @Column({ type: 'boolean', name: 'is_confidential', default: false })
  isConfidential: boolean;

  @Column({ type: 'jsonb', default: [], name: 'attachments' })
  attachments: string[];

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

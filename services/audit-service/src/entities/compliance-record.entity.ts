import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('compliance_records')
export class ComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  regulationType!: 'HIPAA' | 'GDPR' | 'CCPA' | 'OTHER';

  @Column({ type: 'varchar' })
  requirementId!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar' })
  status!: 'compliant' | 'non_compliant' | 'pending_review';

  @Column({ type: 'varchar', default: 'medium' })
  riskLevel!: 'critical' | 'high' | 'medium' | 'low';

  @Column({ type: 'jsonb', nullable: true })
  compensatingControls!: string[] | null;

  @Column({ type: 'int', default: 90 })
  reviewFrequencyDays!: number;

  @Column({ type: 'jsonb' })
  evidence!: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  lastReviewDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextReviewDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

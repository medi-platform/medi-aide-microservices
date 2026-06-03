import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'insurance_claims' })
@Index(['policy_id'])
@Index(['status'])
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) policy_id!: string;
  @Column({ type: 'uuid', nullable: true }) patient_id?: string;
  @Column({ type: 'uuid', nullable: true }) visit_id?: string;
  @Column({ unique: true }) claim_number!: string;
  @Column() service_type!: string;
  @Column({ type: 'date' }) service_date!: Date;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) billed_amount!: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true }) allowed_amount?: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true }) paid_amount?: number;
  @Column({ default: 'draft' }) status!: string;
  @Column({ nullable: true }) denial_reason?: string;
  @Column({ type: 'timestamptz', nullable: true }) submitted_at?: Date;
  @Column({ type: 'timestamptz', nullable: true }) processed_at?: Date;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}



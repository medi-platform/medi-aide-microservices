import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'insurance_policies' })
@Index(['patient_id'])
@Index(['policy_number'])
export class InsurancePolicy {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) patient_id!: string;
  @Column() policy_number!: string;
  @Column() carrier!: string;
  @Column() plan_name!: string;
  @Column({ nullable: true }) group_number?: string;
  @Column({ nullable: true }) member_id?: string;
  @Column({ type: 'date' }) effective_date!: Date;
  @Column({ type: 'date', nullable: true }) termination_date?: Date;
  @Column({ type: 'boolean', default: true }) is_primary!: boolean;
  @Column({ default: 'active' }) status!: string;
  @Column({ type: 'json', nullable: true }) coverage_details?: Record<string, any>;
  @Column({ type: 'json', nullable: true }) copay?: Record<string, number>;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}



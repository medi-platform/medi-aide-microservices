import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_certifications' })
@Index(['caregiver_id'])
export class CaregiverCertification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  issuing_organization?: string;

  @Column({ nullable: true })
  certificate_number?: string;

  @Column({ type: 'date', nullable: true })
  issue_date?: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ default: 'active' })
  status!: string; // active, expired, pending_renewal

  @Column({ nullable: true })
  document_url?: string;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at?: Date;

  @Column({ nullable: true })
  verified_by?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


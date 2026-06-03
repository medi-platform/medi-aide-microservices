import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_compliance_records' })
@Index(['agency_id', 'category'])
export class AgencyComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column()
  category!: string; // licensing, insurance, training, documentation, safety

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  status!: string; // compliant, non_compliant, pending, expired

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ type: 'date', nullable: true })
  last_review_date?: Date;

  @Column({ type: 'date', nullable: true })
  next_review_date?: Date;

  @Column({ nullable: true })
  document_url?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



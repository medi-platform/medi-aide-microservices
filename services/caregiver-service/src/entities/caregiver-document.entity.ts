import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_documents' })
@Index(['caregiver_id'])
export class CaregiverDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column()
  document_type!: string; // government_id, police_check, certificate, etc.

  @Column()
  name!: string;

  @Column({ nullable: true })
  file_url?: string;

  @Column({ nullable: true })
  file_size?: number;

  @Column({ nullable: true })
  mime_type?: string;

  @Column({ default: 'pending_verification' })
  status!: string; // pending_verification, verified, rejected, expired

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at?: Date;

  @Column({ nullable: true })
  verified_by?: string;

  @Column({ nullable: true })
  verification_notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



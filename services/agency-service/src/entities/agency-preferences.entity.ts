import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_preferences' })
@Index(['agency_id'], { unique: true })
export class AgencyPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  agency_id!: string;

  @Column({ default: 'en' })
  default_language!: string;

  @Column({ default: 'America/Toronto' })
  timezone!: string;

  @Column({ default: 'CAD' })
  currency!: string;

  @Column({ type: 'json', nullable: true })
  notification_settings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  scheduling_settings?: {
    default_shift_duration?: number;
    overtime_threshold?: number;
    auto_assign_shifts?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  billing_settings?: {
    payment_terms_days?: number;
    invoice_prefix?: string;
    tax_rate?: number;
  };

  @Column({ type: 'json', nullable: true })
  compliance_settings?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


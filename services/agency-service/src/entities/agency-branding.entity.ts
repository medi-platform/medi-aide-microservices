import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_branding' })
@Index(['agency_id'], { unique: true })
export class AgencyBranding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  agency_id!: string;

  @Column({ nullable: true })
  logo_url?: string;

  @Column({ nullable: true })
  favicon_url?: string;

  @Column({ nullable: true })
  primary_color?: string;

  @Column({ nullable: true })
  secondary_color?: string;

  @Column({ nullable: true })
  accent_color?: string;

  @Column({ nullable: true })
  font_family?: string;

  @Column({ nullable: true })
  custom_domain?: string;

  @Column({ type: 'json', nullable: true })
  email_template_settings?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


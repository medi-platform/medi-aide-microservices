/**
 * Residence Entity
 * Core entity representing a residential care facility (group home, LTC, etc.)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ResidenceType, ResidenceStatus } from '../interfaces/residential.interface';
import { ResidenceAssignment } from './residence-assignment.entity';
import { ResidentialShift } from './residential-shift.entity';

@Entity({ name: 'residences' })
@Index(['agency_id'])
@Index(['status'])
@Index(['province'])
@Index(['type'])
export class Residence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: ResidenceType.GROUP_HOME })
  type!: ResidenceType;

  @Column({ type: 'varchar', length: 20, default: ResidenceStatus.ACTIVE })
  status!: ResidenceStatus;

  // Address
  @Column({ type: 'text', nullable: true })
  street_address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  province?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postal_code?: string;

  // Contact
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fax?: string;

  // Capacity
  @Column({ type: 'int', default: 0 })
  total_beds!: number;

  @Column({ type: 'int', default: 0 })
  occupied_beds!: number;

  @Column({ type: 'int', default: 0 })
  reserved_beds!: number;

  // Licensing
  @Column({ type: 'varchar', length: 100, nullable: true })
  license_number?: string;

  @Column({ type: 'date', nullable: true })
  license_expiry?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  licensing_authority?: string;

  // Operational Details
  @Column({ type: 'uuid', nullable: true })
  manager_user_id?: string;

  @Column({ type: 'jsonb', default: [] })
  services_offered!: string[];

  @Column({ type: 'jsonb', default: {} })
  staffing_requirements!: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  operating_hours!: Record<string, any>;

  // Compliance
  @Column({ type: 'date', nullable: true })
  last_inspection_date?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  inspection_rating?: string;

  @Column({ type: 'jsonb', default: [] })
  certifications!: string[];

  // Metadata
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  // Relations
  @OneToMany(() => ResidenceAssignment, (a) => a.residence)
  assignments!: ResidenceAssignment[];

  @OneToMany(() => ResidentialShift, (s) => s.residence)
  shifts!: ResidentialShift[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

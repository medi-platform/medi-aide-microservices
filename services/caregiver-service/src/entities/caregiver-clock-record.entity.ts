/**
 * Caregiver Clock Record Entity
 * Tracks clock in/out records for caregivers
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ClockRecordType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end',
}

export enum ClockRecordSource {
  MOBILE_APP = 'mobile_app',
  WEB = 'web',
  TABLET = 'tablet',
  MANUAL = 'manual',
  EVV_DEVICE = 'evv_device',
}

@Entity({ name: 'caregiver_clock_records' })
@Index(['caregiver_id'])
@Index(['shift_id'])
@Index(['visit_id'])
@Index(['record_time'])
@Index(['record_type'])
export class CaregiverClockRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'uuid', nullable: true })
  visit_id?: string;

  @Column({ type: 'uuid', nullable: true })
  patient_id?: string;

  @Column({ type: 'varchar', length: 30 })
  record_type!: ClockRecordType;

  @Column({ type: 'timestamptz' })
  record_time!: Date;

  @Column({ type: 'varchar', length: 30, default: ClockRecordSource.MOBILE_APP })
  source!: ClockRecordSource;

  // GPS Location
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy_meters?: number;

  @Column({ type: 'text', nullable: true })
  location_address?: string;

  // EVV Integration
  @Column({ type: 'uuid', nullable: true })
  evv_verification_id?: string;

  @Column({ type: 'boolean', default: false })
  evv_verified!: boolean;

  // Overrides/Adjustments
  @Column({ type: 'boolean', default: false })
  is_adjusted!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  original_time?: Date;

  @Column({ type: 'uuid', nullable: true })
  adjusted_by?: string;

  @Column({ type: 'text', nullable: true })
  adjustment_reason?: string;

  // Device Info
  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_type?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

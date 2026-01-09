import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Work zone preference type
 */
export enum ZonePreference {
  PREFERRED = 'preferred',
  AVAILABLE = 'available',
  EXCLUDED = 'excluded',
}

/**
 * Entity representing a caregiver's work zone/geographic area.
 * Defines where a caregiver is willing to work.
 */
@Entity('caregiver_work_zones')
@Index(['caregiverId', 'preference'])
@Index(['postalCodePrefix'])
export class CaregiverWorkZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'varchar', length: 100, name: 'zone_name' })
  zoneName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ZonePreference,
    default: ZonePreference.AVAILABLE,
  })
  preference: ZonePreference;

  // Geographic definition options
  @Column({ type: 'varchar', length: 10, name: 'postal_code_prefix', nullable: true })
  postalCodePrefix: string; // e.g., 'M5V' for Toronto

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @Column({ type: 'varchar', length: 50, name: 'province_code', nullable: true })
  provinceCode: string;

  // Radius-based zone
  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'center_latitude', nullable: true })
  centerLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'center_longitude', nullable: true })
  centerLongitude: number;

  @Column({ type: 'int', name: 'radius_km', nullable: true })
  radiusKm: number;

  // Additional rate for this zone
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'additional_rate', nullable: true })
  additionalRate: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency: string;

  @Column({ type: 'boolean', name: 'requires_vehicle', default: false })
  requiresVehicle: boolean;

  @Column({ type: 'int', name: 'max_travel_time_minutes', nullable: true })
  maxTravelTimeMinutes: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

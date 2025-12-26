import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Caregiver Location Entity
 * 
 * Stores real-time caregiver locations with H3 hexagonal indexing
 * for ultra-fast geospatial queries.
 */
@Entity('caregiver_locations')
@Index(['h3Index'])
@Index(['isActive', 'lastSeenAt'])
@Index(['city', 'province'])
export class CaregiverLocation {
  @PrimaryColumn('uuid', { name: 'caregiver_id' })
  caregiverId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ name: 'h3_index', type: 'varchar', length: 20, nullable: true })
  @Index()
  h3Index: string;

  @Column({ name: 'h3_resolution', type: 'int', default: 9 })
  h3Resolution: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  province: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
  postalCode: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_available', type: 'boolean', default: false })
  isAvailable: boolean;

  @Column({ name: 'service_radius_km', type: 'int', default: 30 })
  serviceRadiusKm: number;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date;

  @Column({ name: 'location_accuracy', type: 'decimal', precision: 5, scale: 2, nullable: true })
  locationAccuracy: number; // meters

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
















































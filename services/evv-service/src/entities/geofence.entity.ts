import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Geofence Entity
 * Defines geographic boundaries for patient locations
 */
@Entity('evv_geofences')
@Index(['patientId'])
@Index(['isActive', 'patientId'])
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  centerLatitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  centerLongitude!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 200 })
  radiusMeters!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  province?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 50, default: 'circle' })
  shapeType!: 'circle' | 'polygon';

  @Column({ type: 'jsonb', nullable: true })
  polygonCoordinates?: Array<{ lat: number; lng: number }>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  isPrimary!: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

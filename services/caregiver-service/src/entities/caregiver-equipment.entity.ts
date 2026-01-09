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
 * Equipment status
 */
export enum EquipmentStatus {
  ASSIGNED = 'assigned',
  IN_USE = 'in_use',
  RETURNED = 'returned',
  LOST = 'lost',
  DAMAGED = 'damaged',
  MAINTENANCE = 'maintenance',
}

/**
 * Equipment type classification
 */
export enum EquipmentType {
  MOBILE_DEVICE = 'mobile_device',
  TABLET = 'tablet',
  BADGE = 'badge',
  UNIFORM = 'uniform',
  PPE = 'ppe',
  MEDICAL_DEVICE = 'medical_device',
  VEHICLE = 'vehicle',
  KEY = 'key',
  OTHER = 'other',
}

/**
 * Entity representing equipment assigned to a caregiver.
 * Tracks company assets provided to caregivers.
 */
@Entity('caregiver_equipment')
@Index(['caregiverId', 'status'])
@Index(['equipmentType'])
export class CaregiverEquipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({
    type: 'enum',
    enum: EquipmentType,
    name: 'equipment_type',
  })
  equipmentType: EquipmentType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, name: 'serial_number', nullable: true })
  serialNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'asset_tag', nullable: true })
  assetTag: string;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.ASSIGNED,
  })
  status: EquipmentStatus;

  @Column({ type: 'date', name: 'assigned_date' })
  assignedDate: Date;

  @Column({ type: 'date', name: 'returned_date', nullable: true })
  returnedDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  condition: string;

  @Column({ type: 'uuid', name: 'issued_by', nullable: true })
  issuedBy: string;

  @Column({ type: 'uuid', name: 'received_by', nullable: true })
  receivedBy: string;

  @Column({ type: 'date', name: 'warranty_expiry', nullable: true })
  warrantyExpiry: Date;

  @Column({ type: 'date', name: 'maintenance_due', nullable: true })
  maintenanceDue: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', name: 'acknowledgment_file_id', nullable: true })
  acknowledgmentFileId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

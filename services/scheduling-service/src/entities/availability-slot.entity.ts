import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SlotStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  BLOCKED = 'blocked',
  TENTATIVE = 'tentative',
}

export enum SlotType {
  WORK = 'work',
  PERSONAL = 'personal',
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  TRAINING = 'training',
  ON_CALL = 'on_call',
}

@Entity('availability_slots')
@Index(['caregiverId', 'startTime', 'endTime'])
@Index(['status'])
@Index(['visitId'], { unique: true, where: '"visit_id" IS NOT NULL' })
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  caregiverId!: string;

  @Column({ name: 'visit_id', type: 'uuid', nullable: true, unique: true })
  visitId?: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime!: Date;

  @Column({ type: 'enum', enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status!: SlotStatus;

  @Column({ type: 'enum', enum: SlotType, default: SlotType.WORK })
  slotType!: SlotType;

  // Recurrence support
  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ name: 'recurring_pattern_id', type: 'uuid', nullable: true })
  recurringPatternId?: string;

  @Column({ name: 'parent_slot_id', type: 'uuid', nullable: true })
  parentSlotId?: string;

  // Location preferences
  @Column({ name: 'preferred_location', type: 'jsonb', nullable: true })
  preferredLocation?: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
  };

  @Column({ name: 'max_travel_minutes', type: 'int', nullable: true })
  maxTravelMinutes?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


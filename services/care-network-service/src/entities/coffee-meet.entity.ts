import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CoffeeMeetStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('coffee_meets')
@Index(['scheduledAt'])
@Index(['status'])
@Index(['groupId'])
export class CoffeeMeet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  topic!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'duration_minutes', type: 'int', default: 30 })
  durationMinutes!: number;

  @Column({ type: 'enum', enum: CoffeeMeetStatus, default: CoffeeMeetStatus.SCHEDULED })
  status!: CoffeeMeetStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId?: string;

  @Column({ name: 'meeting_provider', type: 'varchar', length: 50, default: 'custom' })
  meetingProvider!: string;

  @Column({ name: 'meeting_url', type: 'text', nullable: true })
  meetingUrl?: string;

  @Column({ name: 'max_participants', type: 'int', default: 4 })
  maxParticipants!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}



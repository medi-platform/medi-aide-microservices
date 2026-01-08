import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('wellness_physio_samples')
@Index(['userId', 'metric', 'recordedAt'])
@Index(['userId', 'deviceType'])
export class PhysioSample {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  metric!: string;

  @Column({ type: 'double precision' })
  value!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit?: string;

  @Column({ type: 'varchar', name: 'device_type', length: 50, nullable: true })
  deviceType?: string;

  @Column({ type: 'varchar', name: 'device_id', length: 100, nullable: true })
  deviceId?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  quality?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'recorded_at' })
  recordedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


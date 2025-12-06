import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Index(['caregiverId', 'scheduledStart'])
@Index(['patientId', 'scheduledStart'])
@Index(['status', 'scheduledStart'])
@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiverId!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'timestamptz' })
  scheduledStart!: Date;

  @Column({ type: 'timestamptz' })
  scheduledEnd!: Date;

  @Column({ type: 'varchar', default: 'scheduled' })
  status!: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

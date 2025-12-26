import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_availability' })
@Index(['caregiver_id', 'date'])
export class CaregiverAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time' })
  start_time!: string;

  @Column({ type: 'time' })
  end_time!: string;

  @Column({ default: 'available' })
  status!: string; // available, unavailable, tentative

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  is_recurring!: boolean;

  @Column({ nullable: true })
  recurrence_pattern?: string; // daily, weekly, biweekly

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


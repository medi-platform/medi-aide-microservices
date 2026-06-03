import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'recurring_patterns' })
@Index(['schedule_id'])
export class RecurringPattern {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) schedule_id!: string;
  @Column() frequency!: string;
  @Column({ type: 'int', nullable: true }) interval?: number;
  @Column('int', { array: true, nullable: true }) days_of_week?: number[];
  @Column({ type: 'date', nullable: true }) end_date?: Date;
  @Column({ type: 'int', nullable: true }) occurrences?: number;
  @CreateDateColumn() created_at!: Date;
}



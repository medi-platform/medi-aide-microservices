import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MentorLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert',
}

@Entity('mentor_profiles')
@Index(['userId'], { unique: true })
@Index(['isActive'])
@Index(['mentorLevel'])
export class MentorProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 120, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'mentor_level', type: 'enum', enum: MentorLevel, default: MentorLevel.MID })
  mentorLevel!: MentorLevel;

  @Column({ name: 'years_experience', type: 'int', default: 0 })
  yearsExperience!: number;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  specializations!: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  skills!: string[];

  @Column({ type: 'text', array: true, default: () => "ARRAY['en']::text[]" })
  languages!: string[];

  @Column({ type: 'varchar', length: 64, default: 'America/Toronto' })
  timezone!: string;

  @Column({ name: 'availability_hours_per_week', type: 'int', default: 2 })
  availabilityHoursPerWeek!: number;

  @Column({ name: 'mentoring_styles', type: 'text', array: true, default: () => "'{}'" })
  mentoringStyles!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'rating_avg', type: 'float', default: 0 })
  ratingAvg!: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}



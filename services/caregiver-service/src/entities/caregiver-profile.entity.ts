import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_profiles' })
@Index(['user_id'], { unique: true })
@Index(['is_approved'])
@Index(['is_active'])
export class CaregiverProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true, unique: true })
  user_id?: string;

  // Professional Information
  @Column('text', { nullable: true })
  bio?: string;

  @Column({ type: 'int', default: 0 })
  experience!: number;

  @Column('text', { array: true, nullable: true })
  skills?: string[];

  @Column('text', { array: true, nullable: true })
  specializations?: string[];

  @Column({ nullable: true })
  specialty?: string;

  // Documents
  @Column({ nullable: true })
  government_id?: string;

  @Column({ nullable: true })
  police_check?: string;

  @Column({ nullable: true })
  certificate?: string;

  @Column({ nullable: true })
  additional_certifications?: string;

  // Location
  @Column({ nullable: true })
  postal_code?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  address?: string;

  // Care Preferences
  @Column({ nullable: true })
  language_spoken?: string;

  @Column('text', { array: true, nullable: true })
  preferred_languages?: string[];

  @Column({ nullable: true })
  cultural_background?: string;

  @Column({ nullable: true })
  gender_preference?: string;

  @Column({ nullable: true })
  preferred_care_environment?: string;

  // Status
  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_approved!: boolean;

  @Column({ type: 'boolean', default: false })
  profile_complete!: boolean;

  // Gamification
  @Column({ type: 'int', default: 0 })
  points!: number;

  @Column({ default: false })
  is_mentor!: boolean;

  // Audit Trail
  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



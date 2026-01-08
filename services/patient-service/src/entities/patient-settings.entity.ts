import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CommunicationPreference {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  PHONE = 'phone',
  ALL = 'all',
  NONE = 'none',
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  CARE_TEAM = 'care_team',
  FAMILY = 'family',
  PRIVATE = 'private',
}

@Entity('patient_settings')
@Index(['patientId'], { unique: true })
export class PatientSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  // Communication preferences
  @Column({
    name: 'communication_preference',
    type: 'enum',
    enum: CommunicationPreference,
    default: CommunicationPreference.ALL,
  })
  communicationPreference!: CommunicationPreference;

  @Column({ name: 'email_notifications', type: 'boolean', default: true })
  emailNotifications!: boolean;

  @Column({ name: 'sms_notifications', type: 'boolean', default: true })
  smsNotifications!: boolean;

  @Column({ name: 'push_notifications', type: 'boolean', default: true })
  pushNotifications!: boolean;

  // Privacy settings
  @Column({
    name: 'profile_visibility',
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.CARE_TEAM,
  })
  profileVisibility!: PrivacyLevel;

  @Column({ name: 'share_health_data_with_family', type: 'boolean', default: false })
  shareHealthDataWithFamily!: boolean;

  @Column({ name: 'allow_anonymous_matching', type: 'boolean', default: true })
  allowAnonymousMatching!: boolean;

  // Caregiver preferences
  @Column({ name: 'preferred_caregiver_gender', nullable: true })
  preferredCaregiverGender?: 'male' | 'female' | 'no_preference';

  @Column({ name: 'preferred_languages', type: 'simple-array', nullable: true })
  preferredLanguages?: string[];

  @Column({ name: 'require_background_check', type: 'boolean', default: true })
  requireBackgroundCheck!: boolean;

  @Column({ name: 'require_certification', type: 'boolean', default: true })
  requireCertification!: boolean;

  // Scheduling preferences
  @Column({ name: 'preferred_visit_times', type: 'jsonb', nullable: true })
  preferredVisitTimes?: {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
  }[];

  @Column({ name: 'min_visit_duration_minutes', type: 'int', default: 60 })
  minVisitDurationMinutes!: number;

  @Column({ name: 'max_visit_duration_minutes', type: 'int', default: 480 })
  maxVisitDurationMinutes!: number;

  // Accessibility
  @Column({ name: 'accessibility_needs', type: 'simple-array', nullable: true })
  accessibilityNeeds?: string[];

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions?: string;

  // Data retention
  @Column({ name: 'data_retention_days', type: 'int', default: 365 })
  dataRetentionDays!: number;

  @Column({ name: 'auto_delete_old_data', type: 'boolean', default: false })
  autoDeleteOldData!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


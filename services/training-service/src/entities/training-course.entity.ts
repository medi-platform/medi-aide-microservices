import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CourseCategory {
  CLINICAL = 'clinical',
  COMPLIANCE = 'compliance',
  SAFETY = 'safety',
  SOFT_SKILLS = 'soft_skills',
  TECHNOLOGY = 'technology',
  ORIENTATION = 'orientation',
  SPECIALIZED = 'specialized',
}

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Training Course Entity
 * Phase 5I: Defines training courses for caregivers
 */
@Entity('training_courses')
@Index(['category', 'status'])
@Index(['isRequired'])
@Index(['agencyId'])
export class TrainingCourse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'title_fr', type: 'varchar', length: 255, nullable: true })
  titleFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  @Column({ type: 'enum', enum: CourseCategory })
  category!: CourseCategory;

  @Column({ type: 'enum', enum: CourseLevel, default: CourseLevel.BEGINNER })
  level!: CourseLevel;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status!: CourseStatus;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string; // null = system-wide course

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  // Course requirements
  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired!: boolean;

  @Column({ name: 'required_for_roles', type: 'simple-array', nullable: true })
  requiredForRoles?: string[];

  @Column({ name: 'prerequisite_course_ids', type: 'simple-array', nullable: true })
  prerequisiteCourseIds?: string[];

  // Duration and content
  @Column({ name: 'estimated_duration_minutes', type: 'int' })
  estimatedDurationMinutes!: number;

  @Column({ name: 'passing_score', type: 'int', default: 80 })
  passingScore!: number; // percentage

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts!: number;

  // Validity
  @Column({ name: 'validity_months', type: 'int', nullable: true })
  validityMonths?: number; // null = never expires

  @Column({ name: 'renewal_course_id', type: 'uuid', nullable: true })
  renewalCourseId?: string;

  // Media
  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'preview_video_url', type: 'text', nullable: true })
  previewVideoUrl?: string;

  // Gamification
  @Column({ name: 'points_on_completion', type: 'int', default: 0 })
  pointsOnCompletion!: number;

  @Column({ name: 'badge_id', type: 'uuid', nullable: true })
  badgeId?: string;

  // Statistics
  @Column({ name: 'enrollment_count', type: 'int', default: 0 })
  enrollmentCount!: number;

  @Column({ name: 'completion_count', type: 'int', default: 0 })
  completionCount!: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

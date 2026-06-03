import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Article Status
 */
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Article Category
 */
export enum ArticleCategory {
  POLICIES = 'policies',
  PROCEDURES = 'procedures',
  TRAINING = 'training',
  FAQ = 'faq',
  ONBOARDING = 'onboarding',
  COMPLIANCE = 'compliance',
  SAFETY = 'safety',
  OTHER = 'other',
}

/**
 * KnowledgeBaseArticle Entity
 * 
 * Agency-specific knowledge base articles for staff and caregivers.
 */
@Entity({ name: 'knowledge_base_articles' })
@Index(['agency_id'])
@Index(['status'])
@Index(['category'])
@Index(['created_at'])
export class KnowledgeBaseArticle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  /** URL-friendly slug */
  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 30, default: ArticleCategory.OTHER })
  category!: ArticleCategory;

  @Column({ type: 'varchar', length: 20, default: ArticleStatus.DRAFT })
  status!: ArticleStatus;

  /** Tags for search/filtering */
  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  /** Who can view: 'all', 'staff', 'caregivers', 'managers' */
  @Column({ type: 'text', array: true, default: '{all}' })
  visibility!: string[];

  /** Featured/pinned article */
  @Column({ type: 'boolean', default: false })
  is_featured!: boolean;

  /** Order for display */
  @Column({ type: 'int', default: 0 })
  order_index!: number;

  // ============================================================================
  // Media
  // ============================================================================

  /** Cover image URL */
  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image_url?: string;

  /** Attached files */
  @Column({ type: 'uuid', array: true, default: '{}' })
  attachments!: string[];

  /** Video URL (if applicable) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  video_url?: string;

  // ============================================================================
  // Versioning
  // ============================================================================

  @Column({ type: 'int', default: 1 })
  version!: number;

  /** Previous version ID */
  @Column({ type: 'uuid', nullable: true })
  previous_version_id?: string;

  // ============================================================================
  // Authorship
  // ============================================================================

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column({ type: 'uuid', nullable: true })
  last_updated_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  published_at?: Date;

  // ============================================================================
  // Engagement
  // ============================================================================

  @Column({ type: 'int', default: 0 })
  view_count!: number;

  @Column({ type: 'int', default: 0 })
  helpful_count!: number;

  @Column({ type: 'int', default: 0 })
  not_helpful_count!: number;

  // ============================================================================
  // Multilingual (for Quebec)
  // ============================================================================

  @Column({ type: 'varchar', length: 5, default: 'en' })
  language!: string;

  /** Link to translated version */
  @Column({ type: 'uuid', nullable: true })
  translation_of?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

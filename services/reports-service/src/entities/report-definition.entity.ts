import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportCategory {
  OPERATIONS = 'operations',
  CLINICAL = 'clinical',
  FINANCIAL = 'financial',
  COMPLIANCE = 'compliance',
  HR = 'hr',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

export enum OutputFormat {
  PDF = 'pdf',
  XLSX = 'xlsx',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

/**
 * Report Definition Entity
 * Phase 5H: Defines available report types and their configurations
 */
@Entity('report_definitions')
@Index(['key'], { unique: true })
@Index(['category', 'status'])
export class ReportDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  key!: string; // Unique identifier e.g., 'caregiver_utilization'

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_fr', type: 'varchar', length: 255, nullable: true })
  nameFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  @Column({ type: 'enum', enum: ReportCategory })
  category!: ReportCategory;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  status!: ReportStatus;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  // Available output formats
  @Column({ name: 'supported_formats', type: 'simple-array' })
  supportedFormats!: OutputFormat[];

  @Column({ name: 'default_format', type: 'enum', enum: OutputFormat, default: OutputFormat.PDF })
  defaultFormat!: OutputFormat;

  // Data source configuration
  @Column({ name: 'data_source', type: 'varchar', length: 100 })
  dataSource!: string; // e.g., 'caregiver-service', 'patient-service'

  @Column({ name: 'query_template', type: 'text', nullable: true })
  queryTemplate?: string;

  // Available filters/parameters
  @Column({ type: 'jsonb', nullable: true })
  parameters?: {
    key: string;
    label: string;
    labelFr?: string;
    type: 'date' | 'date_range' | 'select' | 'multiselect' | 'text' | 'number';
    required: boolean;
    defaultValue?: any;
    options?: { value: string; label: string }[];
  }[];

  // Access control
  @Column({ name: 'required_permissions', type: 'simple-array', nullable: true })
  requiredPermissions?: string[];

  @Column({ name: 'agency_specific', type: 'boolean', default: false })
  agencySpecific!: boolean;

  // Template configuration
  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ name: 'template_config', type: 'jsonb', nullable: true })
  templateConfig?: {
    headerLogo?: string;
    footerText?: string;
    watermark?: string;
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
  };

  // Scheduling defaults
  @Column({ name: 'default_schedule', type: 'varchar', length: 50, nullable: true })
  defaultSchedule?: 'daily' | 'weekly' | 'monthly';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

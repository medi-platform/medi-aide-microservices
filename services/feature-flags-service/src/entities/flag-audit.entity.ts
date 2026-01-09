import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { FlagEnvironment } from '../interfaces/feature-flag.interface';

/**
 * Flag Audit Entity
 * Records all changes to feature flags
 */
@Entity('flag_audits')
@Index(['flagKey', 'createdAt'])
@Index(['changedBy', 'createdAt'])
@Index(['action', 'createdAt'])
export class FlagAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'flag_key', type: 'varchar', length: 100 })
  flagKey!: string;

  @Column({ name: 'flag_id', type: 'uuid', nullable: true })
  flagId?: string;

  @Column({
    type: 'enum',
    enum: FlagEnvironment,
    default: FlagEnvironment.DEVELOPMENT,
  })
  environment!: FlagEnvironment;

  @Column({ type: 'varchar', length: 50 })
  action!: 'created' | 'updated' | 'enabled' | 'disabled' | 'archived' | 'deleted';

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @Column({ name: 'changed_by_email', type: 'varchar', length: 255, nullable: true })
  changedByEmail?: string;

  @Column({ name: 'previous_value', type: 'jsonb', nullable: true })
  previousValue?: Record<string, unknown>;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue?: Record<string, unknown>;

  @Column({ name: 'changed_fields', type: 'text', array: true, default: [] })
  changedFields!: string[];

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


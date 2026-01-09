import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CanadianProvince } from '../interfaces/provincial.interface';

/**
 * Provincial Setting Entity
 * Stores configurable provincial settings
 */
@Entity('provincial_settings')
@Index(['province', 'settingKey'], { unique: true })
@Index(['settingGroup'])
export class ProvincialSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: CanadianProvince,
  })
  province!: CanadianProvince;

  @Column({ name: 'setting_group', type: 'varchar', length: 50 })
  settingGroup!: string;

  @Column({ name: 'setting_key', type: 'varchar', length: 100 })
  settingKey!: string;

  @Column({ name: 'setting_value', type: 'jsonb' })
  settingValue!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate?: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


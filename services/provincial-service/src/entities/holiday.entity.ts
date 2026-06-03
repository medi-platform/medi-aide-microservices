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
 * Holiday Entity
 * Stores statutory holidays by province
 */
@Entity('holidays')
@Index(['holidayDate', 'isFederal'])
@Index(['year'])
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'name_fr', type: 'varchar', length: 100, nullable: true })
  nameFr?: string;

  @Column({ name: 'holiday_date', type: 'date' })
  holidayDate!: Date;

  @Column({ type: 'int' })
  year!: number;

  @Column({ name: 'is_federal', type: 'boolean', default: false })
  isFederal!: boolean;

  @Column({
    type: 'enum',
    enum: CanadianProvince,
    array: true,
    default: [],
  })
  provinces!: CanadianProvince[];

  @Column({ name: 'is_paid', type: 'boolean', default: true })
  isPaid!: boolean;

  @Column({ name: 'pay_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.5 })
  payMultiplier!: number;

  @Column({ name: 'calculation_rule', type: 'varchar', length: 100, nullable: true })
  calculationRule?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


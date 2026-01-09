import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Labor Rule Type
 */
export enum LaborRuleType {
  REST_PERIOD = 'REST_PERIOD',
  DAILY_REST = 'DAILY_REST',
  WEEKLY_REST = 'WEEKLY_REST',
  OVERTIME = 'OVERTIME',
  SPLIT_SHIFT = 'SPLIT_SHIFT',
  BREAK = 'BREAK',
  MAXIMUM_HOURS = 'MAXIMUM_HOURS',
  MINIMUM_WAGE = 'MINIMUM_WAGE',
  STATUTORY_HOLIDAY = 'STATUTORY_HOLIDAY',
  VACATION_ACCRUAL = 'VACATION_ACCRUAL',
}

/**
 * Enforcement Level
 */
export enum EnforcementLevel {
  HARD = 'hard',
  SOFT = 'soft',
  ADVISORY = 'advisory',
}

export interface RestPeriodDefinition {
  value: number;
  unit: 'hours' | 'minutes';
  applies_to: string;
}

export interface OvertimeDefinition {
  weeklyThreshold: number;
  dailyThreshold?: number;
  rate: number;
  doubleTimeThreshold?: number;
  doubleTimeRate?: number;
  calculation_period?: string;
}

export interface SplitShiftDefinition {
  applies: boolean;
  minimumGap: number;
  unit: 'hours' | 'minutes';
}

export interface MinimumWageDefinition {
  rate: number;
  effectiveDate: string;
  exemptions?: string[];
}

export type RuleDefinition = 
  | RestPeriodDefinition 
  | OvertimeDefinition 
  | SplitShiftDefinition 
  | MinimumWageDefinition 
  | Record<string, unknown>;

/**
 * LaborRule Entity
 * 
 * Stores provincial labor law rules for Canadian provinces.
 * Used by the Labor Law Compliance Engine to validate schedules.
 */
@Entity({ name: 'labor_rules' })
@Index(['province', 'is_active'])
@Index(['effective_from', 'effective_to'])
@Index(['rule_type'])
export class LaborRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Canadian province code (e.g., ON, BC, QC) */
  @Column({ type: 'varchar', length: 2 })
  province!: string;

  @Column({ type: 'varchar', length: 50 })
  rule_type!: LaborRuleType;

  @Column({ type: 'varchar', length: 100 })
  rule_name!: string;

  /** JSON definition of the rule parameters */
  @Column({ type: 'jsonb' })
  rule_definition!: RuleDefinition;

  @Column({ type: 'date' })
  effective_from!: Date;

  @Column({ type: 'date', nullable: true })
  effective_to?: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  /** Legal citation for the rule */
  @Column({ type: 'varchar', length: 255, nullable: true })
  citation?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: EnforcementLevel.HARD })
  enforcement_level!: EnforcementLevel;

  /** Information about penalties for violations */
  @Column({ type: 'jsonb', nullable: true })
  penalty_info?: {
    minFine?: number;
    maxFine?: number;
    currency?: string;
    otherConsequences?: string[];
  };

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

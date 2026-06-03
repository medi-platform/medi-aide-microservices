import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import {
  LaborRule,
  LaborRuleType,
  EnforcementLevel,
  OvertimeDefinition,
  RestPeriodDefinition,
} from '../entities/labor-rule.entity';

export interface ValidateShiftDto {
  province: string;
  caregiver_id: string;
  shift_start: Date;
  shift_end: Date;
  previous_shift_end?: Date;
  weekly_hours_worked: number;
}

export interface ShiftValidationResult {
  is_valid: boolean;
  violations: {
    rule_id: string;
    rule_type: LaborRuleType;
    severity: EnforcementLevel;
    message: string;
    details?: Record<string, unknown>;
  }[];
  warnings: string[];
  overtime_hours?: number;
  overtime_rate?: number;
}

export interface OvertimeCalculation {
  regular_hours: number;
  overtime_hours: number;
  double_time_hours: number;
  overtime_rate: number;
  double_time_rate?: number;
}

/**
 * LaborRulesService
 * 
 * Manages Canadian provincial labor law rules and validates shifts.
 */
@Injectable()
export class LaborRulesService {
  private readonly logger = new Logger(LaborRulesService.name);

  // Canadian provinces
  private readonly PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

  constructor(
    @InjectRepository(LaborRule)
    private readonly ruleRepo: Repository<LaborRule>,
  ) {}

  // ===========================================================================
  // Rule Management
  // ===========================================================================

  async createRule(rule: Partial<LaborRule>): Promise<LaborRule> {
    if (!rule.province || !this.PROVINCES.includes(rule.province)) {
      throw new BadRequestException(`Invalid province: ${rule.province}`);
    }

    const newRule = this.ruleRepo.create(rule);
    return this.ruleRepo.save(newRule);
  }

  async updateRule(id: string, updates: Partial<LaborRule>): Promise<LaborRule> {
    const rule = await this.getRuleById(id);
    Object.assign(rule, updates);
    return this.ruleRepo.save(rule);
  }

  async getRuleById(id: string): Promise<LaborRule> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Labor rule ${id} not found`);
    }
    return rule;
  }

  async getActiveRulesForProvince(province: string, date?: Date): Promise<LaborRule[]> {
    const effectiveDate = date || new Date();

    return this.ruleRepo.find({
      where: {
        province,
        is_active: true,
        effective_from: LessThanOrEqual(effectiveDate),
      },
      order: { rule_type: 'ASC', effective_from: 'DESC' },
    });
  }

  async getRulesByType(province: string, ruleType: LaborRuleType): Promise<LaborRule[]> {
    const today = new Date();

    return this.ruleRepo.find({
      where: {
        province,
        rule_type: ruleType,
        is_active: true,
        effective_from: LessThanOrEqual(today),
      },
      order: { effective_from: 'DESC' },
    });
  }

  // ===========================================================================
  // Shift Validation
  // ===========================================================================

  async validateShift(dto: ValidateShiftDto): Promise<ShiftValidationResult> {
    this.logger.debug(`Validating shift for province ${dto.province}`);

    const rules = await this.getActiveRulesForProvince(dto.province);
    const violations: ShiftValidationResult['violations'] = [];
    const warnings: string[] = [];

    const shiftDuration = this.calculateHours(dto.shift_start, dto.shift_end);

    for (const rule of rules) {
      const violation = this.checkRule(rule, dto, shiftDuration);
      if (violation) {
        if (rule.enforcement_level === EnforcementLevel.ADVISORY) {
          warnings.push(violation.message);
        } else {
          violations.push({
            rule_id: rule.id,
            rule_type: rule.rule_type as LaborRuleType,
            severity: rule.enforcement_level as EnforcementLevel,
            message: violation.message,
            details: violation.details,
          });
        }
      }
    }

    // Calculate overtime
    const overtimeCalc = await this.calculateOvertime(
      dto.province,
      dto.weekly_hours_worked,
      shiftDuration,
    );

    return {
      is_valid: violations.filter(v => v.severity === EnforcementLevel.HARD).length === 0,
      violations,
      warnings,
      overtime_hours: overtimeCalc?.overtime_hours,
      overtime_rate: overtimeCalc?.overtime_rate,
    };
  }

  private checkRule(
    rule: LaborRule,
    dto: ValidateShiftDto,
    shiftDuration: number,
  ): { message: string; details?: Record<string, unknown> } | null {
    switch (rule.rule_type) {
      case LaborRuleType.REST_PERIOD:
        return this.checkRestPeriod(rule, dto);
      case LaborRuleType.MAXIMUM_HOURS:
        return this.checkMaximumHours(rule, shiftDuration);
      case LaborRuleType.DAILY_REST:
        return this.checkDailyRest(rule, dto);
      case LaborRuleType.BREAK:
        return this.checkBreakRequirement(rule, shiftDuration);
      default:
        return null;
    }
  }

  private checkRestPeriod(
    rule: LaborRule,
    dto: ValidateShiftDto,
  ): { message: string; details?: Record<string, unknown> } | null {
    if (!dto.previous_shift_end) return null;

    const definition = rule.rule_definition as RestPeriodDefinition;
    const requiredRestHours = definition.unit === 'hours' 
      ? definition.value 
      : definition.value / 60;

    const actualRest = this.calculateHours(dto.previous_shift_end, dto.shift_start);

    if (actualRest < requiredRestHours) {
      return {
        message: `Insufficient rest period. Required: ${requiredRestHours}h, Actual: ${actualRest.toFixed(1)}h`,
        details: { required: requiredRestHours, actual: actualRest },
      };
    }

    return null;
  }

  private checkMaximumHours(
    rule: LaborRule,
    shiftDuration: number,
  ): { message: string; details?: Record<string, unknown> } | null {
    const definition = rule.rule_definition as { value: number };
    
    if (shiftDuration > definition.value) {
      return {
        message: `Shift exceeds maximum hours. Maximum: ${definition.value}h, Actual: ${shiftDuration.toFixed(1)}h`,
        details: { maximum: definition.value, actual: shiftDuration },
      };
    }

    return null;
  }

  private checkDailyRest(
    rule: LaborRule,
    dto: ValidateShiftDto,
  ): { message: string; details?: Record<string, unknown> } | null {
    if (!dto.previous_shift_end) return null;

    const definition = rule.rule_definition as RestPeriodDefinition;
    const requiredHours = definition.unit === 'hours' ? definition.value : definition.value / 60;
    const actualRest = this.calculateHours(dto.previous_shift_end, dto.shift_start);

    if (actualRest < requiredHours) {
      return {
        message: `Insufficient daily rest. Required: ${requiredHours}h between shifts`,
        details: { required: requiredHours, actual: actualRest },
      };
    }

    return null;
  }

  private checkBreakRequirement(
    rule: LaborRule,
    shiftDuration: number,
  ): { message: string; details?: Record<string, unknown> } | null {
    // This would typically check if breaks are scheduled
    // For now, just flag shifts over 5 hours that need breaks
    const definition = rule.rule_definition as { shift_threshold?: number };
    const threshold = definition.shift_threshold || 5;

    if (shiftDuration >= threshold) {
      return {
        message: `Shift of ${shiftDuration.toFixed(1)}h requires scheduled break(s)`,
        details: { shift_duration: shiftDuration },
      };
    }

    return null;
  }

  // ===========================================================================
  // Overtime Calculation
  // ===========================================================================

  async calculateOvertime(
    province: string,
    weeklyHoursWorked: number,
    additionalHours: number,
  ): Promise<OvertimeCalculation | null> {
    const overtimeRules = await this.getRulesByType(province, LaborRuleType.OVERTIME);
    
    if (overtimeRules.length === 0) {
      // Default Canadian overtime (44 hours/week)
      return this.calculateOvertimeWithRule({
        weeklyThreshold: 44,
        rate: 1.5,
      }, weeklyHoursWorked, additionalHours);
    }

    const rule = overtimeRules[0];
    const definition = rule.rule_definition as OvertimeDefinition;

    return this.calculateOvertimeWithRule(definition, weeklyHoursWorked, additionalHours);
  }

  private calculateOvertimeWithRule(
    definition: OvertimeDefinition,
    weeklyHoursWorked: number,
    additionalHours: number,
  ): OvertimeCalculation {
    const totalHours = weeklyHoursWorked + additionalHours;
    const threshold = definition.weeklyThreshold;
    const doubleTimeThreshold = definition.doubleTimeThreshold;

    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    if (totalHours <= threshold) {
      regularHours = additionalHours;
    } else if (weeklyHoursWorked >= threshold) {
      // Already in overtime for the whole shift
      if (doubleTimeThreshold && totalHours > doubleTimeThreshold) {
        if (weeklyHoursWorked >= doubleTimeThreshold) {
          doubleTimeHours = additionalHours;
        } else {
          overtimeHours = doubleTimeThreshold - weeklyHoursWorked;
          doubleTimeHours = totalHours - doubleTimeThreshold;
        }
      } else {
        overtimeHours = additionalHours;
      }
    } else {
      // Partially in overtime
      regularHours = threshold - weeklyHoursWorked;
      const remainingHours = additionalHours - regularHours;

      if (doubleTimeThreshold && totalHours > doubleTimeThreshold) {
        overtimeHours = doubleTimeThreshold - threshold;
        doubleTimeHours = totalHours - doubleTimeThreshold;
      } else {
        overtimeHours = remainingHours;
      }
    }

    return {
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      double_time_hours: doubleTimeHours,
      overtime_rate: definition.rate,
      double_time_rate: definition.doubleTimeRate,
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private calculateHours(start: Date, end: Date): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return ms / (1000 * 60 * 60);
  }

  async getProvinceOvertimeRates(): Promise<Record<string, { threshold: number; rate: number }>> {
    const rates: Record<string, { threshold: number; rate: number }> = {};

    for (const province of this.PROVINCES) {
      const rules = await this.getRulesByType(province, LaborRuleType.OVERTIME);
      if (rules.length > 0) {
        const def = rules[0].rule_definition as OvertimeDefinition;
        rates[province] = { threshold: def.weeklyThreshold, rate: def.rate };
      } else {
        // Default
        rates[province] = { threshold: 44, rate: 1.5 };
      }
    }

    return rates;
  }
}

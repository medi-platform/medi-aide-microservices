import { Injectable, Logger } from '@nestjs/common';
import {
  CanadianProvince,
  ProvincialLaborRules,
  ShiftValidationResult,
  ShiftViolation,
  ViolationSeverity,
} from '../interfaces/provincial.interface';

/**
 * Labor Rules Service
 * Comprehensive Canadian provincial labor law validation
 */
@Injectable()
export class LaborRulesService {
  private readonly logger = new Logger(LaborRulesService.name);

  // Federal holidays observed across all provinces
  private readonly federalHolidays = [
    "New Year's Day",
    'Good Friday',
    'Victoria Day',
    'Canada Day',
    'Labour Day',
    'Thanksgiving',
    'Remembrance Day',
    'Christmas Day',
    'Boxing Day',
  ];

  // Provincial labor rules - updated 2024
  private readonly laborRules: Map<CanadianProvince, ProvincialLaborRules> = new Map([
    [CanadianProvince.ON, {
      province: CanadianProvince.ON,
      provinceName: 'Ontario',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 13,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 44,
      maxConsecutiveDays: 7,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 16.55,
      minimumWageEffectiveDate: '2024-10-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'Civic Holiday'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.BC, {
      province: CanadianProvince.BC,
      provinceName: 'British Columbia',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 4,
      minimumWage: 17.40,
      minimumWageEffectiveDate: '2024-06-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['BC Day', 'Family Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.AB, {
      province: CanadianProvince.AB,
      provinceName: 'Alberta',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 44,
      maxConsecutiveDays: 24,
      weeklyRestDayRequired: false,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 15.00,
      minimumWageEffectiveDate: '2019-10-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'Alberta Heritage Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.QC, {
      province: CanadianProvince.QC,
      provinceName: 'Quebec',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 4,
      minimumWage: 15.75,
      minimumWageEffectiveDate: '2024-05-01',
      holidayRules: {
        federalHolidays: this.federalHolidays.filter(h => h !== 'Victoria Day'),
        provincialHolidays: ['National Patriots Day', 'Saint-Jean-Baptiste Day', 'National Day for Truth and Reconciliation'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.MB, {
      province: CanadianProvince.MB,
      provinceName: 'Manitoba',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 15.80,
      minimumWageEffectiveDate: '2024-10-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Louis Riel Day', 'Civic Holiday'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.SK, {
      province: CanadianProvince.SK,
      provinceName: 'Saskatchewan',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 10,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 4,
      minimumWage: 15.00,
      minimumWageEffectiveDate: '2024-10-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'Saskatchewan Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.NS, {
      province: CanadianProvince.NS,
      provinceName: 'Nova Scotia',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 48,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 15.20,
      minimumWageEffectiveDate: '2024-04-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Heritage Day', 'Natal Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.NB, {
      province: CanadianProvince.NB,
      provinceName: 'New Brunswick',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 44,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 15.30,
      minimumWageEffectiveDate: '2024-04-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['New Brunswick Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.NL, {
      province: CanadianProvince.NL,
      provinceName: 'Newfoundland and Labrador',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 15.60,
      minimumWageEffectiveDate: '2024-04-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['St. Patrick\'s Day', 'St. George\'s Day', 'Discovery Day', 'Orangemen\'s Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.PE, {
      province: CanadianProvince.PE,
      provinceName: 'Prince Edward Island',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 48,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 15.40,
      minimumWageEffectiveDate: '2024-04-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Islander Day', 'Gold Cup Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.NT, {
      province: CanadianProvince.NT,
      provinceName: 'Northwest Territories',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 10,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 16.70,
      minimumWageEffectiveDate: '2024-09-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['National Indigenous Peoples Day', 'Civic Holiday'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.YT, {
      province: CanadianProvince.YT,
      provinceName: 'Yukon',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 17.59,
      minimumWageEffectiveDate: '2024-04-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Discovery Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
    [CanadianProvince.NU, {
      province: CanadianProvince.NU,
      provinceName: 'Nunavut',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 10,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      minimumWage: 19.00,
      minimumWageEffectiveDate: '2024-01-01',
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Nunavut Day', 'Civic Holiday'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    }],
  ]);

  /**
   * Get labor rules for a province
   */
  getRulesForProvince(province: CanadianProvince): ProvincialLaborRules {
    const rules = this.laborRules.get(province);
    if (!rules) {
      // Default to Ontario rules
      return this.laborRules.get(CanadianProvince.ON)!;
    }
    return rules;
  }

  /**
   * Get all provincial labor rules
   */
  getAllRules(): ProvincialLaborRules[] {
    return Array.from(this.laborRules.values());
  }

  /**
   * Validate a shift against provincial rules
   */
  validateShift(
    province: CanadianProvince,
    shiftDurationHours: number,
    restHoursSincePreviousShift?: number,
    consecutiveDaysWorked?: number,
    weeklyHoursWorked?: number,
  ): ShiftValidationResult {
    const rules = this.getRulesForProvince(province);
    const violations: ShiftViolation[] = [];
    const warnings: ShiftViolation[] = [];
    const suggestions: string[] = [];

    // Check maximum daily hours
    if (shiftDurationHours > rules.maxDailyHours) {
      violations.push({
        type: 'MAX_DAILY_HOURS_EXCEEDED',
        severity: ViolationSeverity.BLOCK,
        description: `Shift duration (${shiftDurationHours}h) exceeds maximum (${rules.maxDailyHours}h) for ${rules.provinceName}`,
        rule: 'maxDailyHours',
        actualValue: shiftDurationHours,
        requiredValue: rules.maxDailyHours,
        unit: 'hours',
      });
    }

    // Check minimum rest between shifts
    if (restHoursSincePreviousShift !== undefined && restHoursSincePreviousShift < rules.minRestBetweenShiftsHours) {
      violations.push({
        type: 'INSUFFICIENT_REST',
        severity: ViolationSeverity.BLOCK,
        description: `Rest period (${restHoursSincePreviousShift}h) is below minimum (${rules.minRestBetweenShiftsHours}h) for ${rules.provinceName}`,
        rule: 'minRestBetweenShiftsHours',
        actualValue: restHoursSincePreviousShift,
        requiredValue: rules.minRestBetweenShiftsHours,
        unit: 'hours',
      });
    }

    // Check consecutive days
    if (consecutiveDaysWorked !== undefined && consecutiveDaysWorked >= rules.maxConsecutiveDays) {
      violations.push({
        type: 'MAX_CONSECUTIVE_DAYS_EXCEEDED',
        severity: ViolationSeverity.WARNING,
        description: `Consecutive days worked (${consecutiveDaysWorked}) exceeds maximum (${rules.maxConsecutiveDays}) for ${rules.provinceName}`,
        rule: 'maxConsecutiveDays',
        actualValue: consecutiveDaysWorked,
        requiredValue: rules.maxConsecutiveDays,
        unit: 'days',
      });
    }

    // Check overtime threshold
    if (weeklyHoursWorked !== undefined) {
      const totalWeeklyHours = weeklyHoursWorked + shiftDurationHours;
      if (totalWeeklyHours > rules.overtimeThresholdWeeklyHours) {
        warnings.push({
          type: 'OVERTIME_THRESHOLD_EXCEEDED',
          severity: ViolationSeverity.WARNING,
          description: `Weekly hours (${totalWeeklyHours}h) exceeds overtime threshold (${rules.overtimeThresholdWeeklyHours}h). Overtime pay applies.`,
          rule: 'overtimeThresholdWeeklyHours',
          actualValue: totalWeeklyHours,
          requiredValue: rules.overtimeThresholdWeeklyHours,
          unit: 'hours',
        });
        suggestions.push(`Overtime rate of ${rules.overtimePayMultiplier}x applies for hours beyond ${rules.overtimeThresholdWeeklyHours}`);
      }
    }

    // Check if shift requires break
    if (shiftDurationHours >= rules.breakRequiredAfterHours) {
      suggestions.push(`A ${rules.breakDurationMinutes}-minute break is required for shifts of ${rules.breakRequiredAfterHours}+ hours`);
    }

    return {
      isCompliant: violations.filter((v) => v.severity === ViolationSeverity.BLOCK).length === 0,
      violations,
      warnings,
      suggestions,
    };
  }

  /**
   * Get required documents for caregivers by province
   */
  getRequiredDocuments(province: CanadianProvince): string[] {
    const baseDocuments = [
      'Government-issued ID',
      'Work authorization (if applicable)',
      'Criminal background check',
      'Vulnerable sector check',
      'First Aid/CPR certification',
      'Professional liability insurance',
    ];

    const provincialDocuments: Record<CanadianProvince, string[]> = {
      [CanadianProvince.ON]: ['PHIPA training certificate', 'TB test results'],
      [CanadianProvince.BC]: ['BC Care Aide Registry', 'WorkSafeBC coverage'],
      [CanadianProvince.AB]: ['Alberta Health Services clearance'],
      [CanadianProvince.QC]: ['Language proficiency (French)'],
      [CanadianProvince.MB]: ['PHIA training certificate'],
      [CanadianProvince.SK]: ['HIPA training certificate'],
      [CanadianProvince.NS]: ['PHIA-NS training certificate'],
      [CanadianProvince.NB]: ['PHIA-NB training certificate', 'Language proficiency (Bilingual preferred)'],
      [CanadianProvince.NL]: ['PHIA-NL training certificate'],
      [CanadianProvince.PE]: ['Provincial health clearance'],
      [CanadianProvince.NT]: ['Northern allowance documentation'],
      [CanadianProvince.YT]: ['Northern allowance documentation'],
      [CanadianProvince.NU]: ['Northern allowance documentation', 'Inuit language skills (preferred)'],
    };

    return [...baseDocuments, ...(provincialDocuments[province] || [])];
  }

  /**
   * Get minimum wage for province
   */
  getMinimumWage(province: CanadianProvince): { wage: number; effectiveDate: string } {
    const rules = this.getRulesForProvince(province);
    return {
      wage: rules.minimumWage,
      effectiveDate: rules.minimumWageEffectiveDate,
    };
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { ProvincialLabourRules } from '../interfaces/labor-law.interface';

/**
 * Provincial Rules Service
 * 
 * Provides Canadian provincial labor law rules for:
 * - Ontario (ON)
 * - British Columbia (BC)
 * - Alberta (AB)
 * - Quebec (QC)
 * - Manitoba (MB)
 * - Saskatchewan (SK)
 * - Nova Scotia (NS)
 * - New Brunswick (NB)
 * - Newfoundland and Labrador (NL)
 * - Prince Edward Island (PE)
 * - Northwest Territories (NT)
 * - Yukon (YT)
 * - Nunavut (NU)
 */
@Injectable()
export class ProvincialRulesService {
  private readonly logger = new Logger(ProvincialRulesService.name);

  // Canadian federal holidays
  private readonly federalHolidays = [
    'New Year\'s Day',
    'Good Friday',
    'Victoria Day',
    'Canada Day',
    'Labour Day',
    'Thanksgiving',
    'Remembrance Day',
    'Christmas Day',
    'Boxing Day',
  ];

  // Provincial rules configuration
  private readonly provincialRules: Record<string, ProvincialLabourRules> = {
    ON: {
      province: 'ON',
      provinceName: 'Ontario',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 13,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 44,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'Civic Holiday'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    BC: {
      province: 'BC',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'BC Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    AB: {
      province: 'AB',
      provinceName: 'Alberta',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 44,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'Alberta Family Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    QC: {
      province: 'QC',
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
      holidayRules: {
        federalHolidays: this.federalHolidays.filter(h => h !== 'Remembrance Day'),
        provincialHolidays: ['National Patriots\' Day', 'Saint-Jean-Baptiste Day', 'National Day for Truth and Reconciliation'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    MB: {
      province: 'MB',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Louis Riel Day', 'Terry Fox Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    SK: {
      province: 'SK',
      provinceName: 'Saskatchewan',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Family Day', 'Saskatchewan Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    NS: {
      province: 'NS',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Heritage Day', 'Natal Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    NB: {
      province: 'NB',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['New Brunswick Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    NL: {
      province: 'NL',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['St. Patrick\'s Day', 'St. George\'s Day', 'Discovery Day', 'Orangemen\'s Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    PE: {
      province: 'PE',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Islander Day', 'Gold Cup Parade Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    NT: {
      province: 'NT',
      provinceName: 'Northwest Territories',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['National Aboriginal Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    YT: {
      province: 'YT',
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
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Discovery Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
    NU: {
      province: 'NU',
      provinceName: 'Nunavut',
      minRestBetweenShiftsHours: 8,
      maxDailyHours: 12,
      overtimeThresholdDailyHours: 8,
      overtimeThresholdWeeklyHours: 40,
      maxConsecutiveDays: 6,
      weeklyRestDayRequired: true,
      breakRequiredAfterHours: 5,
      breakDurationMinutes: 30,
      splitShiftMaxGapHours: 5,
      holidayRules: {
        federalHolidays: this.federalHolidays,
        provincialHolidays: ['Nunavut Day'],
        holidayPayMultiplier: 1.5,
      },
      overtimePayMultiplier: 1.5,
      statHolidayPayMultiplier: 1.5,
    },
  };

  /**
   * Get labor rules for a specific province
   */
  getRulesForProvince(provinceCode: string): ProvincialLabourRules {
    const normalizedCode = provinceCode?.toUpperCase()?.trim() || 'ON';
    const rules = this.provincialRules[normalizedCode];

    if (!rules) {
      this.logger.warn(`No rules found for province ${normalizedCode}, defaulting to Ontario`);
      return this.provincialRules['ON'];
    }

    return rules;
  }

  /**
   * Get all supported provinces
   */
  getAllProvinces(): Array<{ code: string; name: string }> {
    return Object.values(this.provincialRules).map(rules => ({
      code: rules.province,
      name: rules.provinceName,
    }));
  }

  /**
   * Check if a province is supported
   */
  isProvinceSupported(provinceCode: string): boolean {
    return !!this.provincialRules[provinceCode?.toUpperCase()?.trim()];
  }

  /**
   * Get overtime calculation for a province
   */
  calculateOvertime(
    provinceCode: string,
    dailyHours: number,
    weeklyHours: number,
  ): {
    regularHours: number;
    dailyOvertimeHours: number;
    weeklyOvertimeHours: number;
    totalOvertimeHours: number;
  } {
    const rules = this.getRulesForProvince(provinceCode);
    
    const dailyOvertimeHours = Math.max(0, dailyHours - rules.overtimeThresholdDailyHours);
    const weeklyOvertimeHours = Math.max(0, weeklyHours - rules.overtimeThresholdWeeklyHours);
    
    // Avoid double-counting overtime
    const totalOvertimeHours = Math.max(dailyOvertimeHours, weeklyOvertimeHours);
    const regularHours = Math.min(dailyHours, weeklyHours) - totalOvertimeHours;

    return {
      regularHours: Math.max(0, regularHours),
      dailyOvertimeHours,
      weeklyOvertimeHours,
      totalOvertimeHours,
    };
  }

  /**
   * Get required provincial compliance documents
   */
  getRequiredDocuments(provinceCode: string): string[] {
    const requirements: Record<string, string[]> = {
      ON: [
        'business_license',
        'wsib_coverage',
        'general_liability_insurance',
        'professional_liability_insurance',
        'criminal_background_check',
        'first_aid_certification',
      ],
      BC: [
        'business_license',
        'worksafe_bc_coverage',
        'general_liability_insurance',
        'home_support_registry',
        'criminal_background_check',
        'first_aid_certification',
      ],
      AB: [
        'business_license',
        'wcb_coverage',
        'general_liability_insurance',
        'health_services_permit',
        'criminal_background_check',
        'first_aid_certification',
      ],
      QC: [
        'business_license',
        'cnesst_registration',
        'general_liability_insurance',
        'french_language_certification',
        'criminal_background_check',
        'first_aid_certification',
      ],
    };

    return requirements[provinceCode?.toUpperCase()] || requirements['ON'];
  }

  /**
   * Validate shift against provincial rules
   */
  validateShift(
    provinceCode: string,
    shiftDurationHours: number,
    restHoursSincePreviousShift?: number,
  ): { isValid: boolean; violations: string[] } {
    const rules = this.getRulesForProvince(provinceCode);
    const violations: string[] = [];

    if (shiftDurationHours > rules.maxDailyHours) {
      violations.push(
        `Shift duration (${shiftDurationHours}h) exceeds maximum (${rules.maxDailyHours}h) for ${rules.provinceName}`,
      );
    }

    if (
      restHoursSincePreviousShift !== undefined &&
      restHoursSincePreviousShift < rules.minRestBetweenShiftsHours
    ) {
      violations.push(
        `Rest period (${restHoursSincePreviousShift}h) is below minimum (${rules.minRestBetweenShiftsHours}h) for ${rules.provinceName}`,
      );
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}


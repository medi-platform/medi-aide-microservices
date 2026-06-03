import { Injectable, Logger } from '@nestjs/common';
import { CanadianProvince, ProvincialTaxRules } from '../interfaces/provincial.interface';

/**
 * Tax Rules Service
 * Comprehensive Canadian provincial tax calculations
 */
@Injectable()
export class TaxRulesService {
  private readonly logger = new Logger(TaxRulesService.name);

  // Federal GST rate (5%)
  private readonly GST_RATE = 0.05;

  // Provincial tax rules - updated 2024
  private readonly taxRules: Map<CanadianProvince, ProvincialTaxRules> = new Map([
    [CanadianProvince.ON, {
      province: CanadianProvince.ON,
      provincialTaxRate: 0.0505, // First bracket
      pstRate: 0.08, // Combined into HST
      gstRate: this.GST_RATE,
      hstRate: 0.13,
      usesHST: true,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: 490000, rate: 0 },
          { maxPayroll: 1000000, rate: 0.0098 },
          { maxPayroll: Infinity, rate: 0.0195 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.56, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.91, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.BC, {
      province: CanadianProvince.BC,
      provincialTaxRate: 0.0506, // First bracket
      pstRate: 0.07,
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: 500000, rate: 0 },
          { maxPayroll: 1500000, rate: 0.0098 },
          { maxPayroll: Infinity, rate: 0.0195 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.45, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.82, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.AB, {
      province: CanadianProvince.AB,
      provincialTaxRate: 0.10, // Flat rate
      pstRate: 0, // No PST
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: false,
        thresholds: [],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.39, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.75, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.QC, {
      province: CanadianProvince.QC,
      provincialTaxRate: 0.14, // First bracket
      pstRate: 0.09975, // QST
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: 1000000, rate: 0.0165 },
          { maxPayroll: 7000000, rate: 0.0176 },
          { maxPayroll: Infinity, rate: 0.0465 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.52, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.88, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.MB, {
      province: CanadianProvince.MB,
      provincialTaxRate: 0.108, // First bracket
      pstRate: 0.07,
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: 2500000, rate: 0 },
          { maxPayroll: Infinity, rate: 0.0465 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.48, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.85, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.SK, {
      province: CanadianProvince.SK,
      provincialTaxRate: 0.105, // First bracket
      pstRate: 0.06,
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: false,
        thresholds: [],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.42, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.78, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.NS, {
      province: CanadianProvince.NS,
      provincialTaxRate: 0.0879, // First bracket
      pstRate: 0.10, // Combined into HST
      gstRate: this.GST_RATE,
      hstRate: 0.15,
      usesHST: true,
      employerHealthTax: {
        applicable: false,
        thresholds: [],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.55, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.92, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.NB, {
      province: CanadianProvince.NB,
      provincialTaxRate: 0.094, // First bracket
      pstRate: 0.10, // Combined into HST
      gstRate: this.GST_RATE,
      hstRate: 0.15,
      usesHST: true,
      employerHealthTax: {
        applicable: false,
        thresholds: [],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.51, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.88, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.NL, {
      province: CanadianProvince.NL,
      provincialTaxRate: 0.087, // First bracket
      pstRate: 0.10, // Combined into HST
      gstRate: this.GST_RATE,
      hstRate: 0.15,
      usesHST: true,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: 2000000, rate: 0.02 },
          { maxPayroll: Infinity, rate: 0.02 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.58, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.95, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.PE, {
      province: CanadianProvince.PE,
      provincialTaxRate: 0.098, // First bracket
      pstRate: 0.10, // Combined into HST
      gstRate: this.GST_RATE,
      hstRate: 0.15,
      usesHST: true,
      employerHealthTax: {
        applicable: false,
        thresholds: [],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.49, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.86, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.NT, {
      province: CanadianProvince.NT,
      provincialTaxRate: 0.059, // First bracket
      pstRate: 0, // No PST
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: Infinity, rate: 0.02 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.62, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 1.05, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.YT, {
      province: CanadianProvince.YT,
      provincialTaxRate: 0.064, // First bracket
      pstRate: 0, // No PST
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: false,
        thresholds: [],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.55, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 0.95, description: 'Home care services' },
      ],
    }],
    [CanadianProvince.NU, {
      province: CanadianProvince.NU,
      provincialTaxRate: 0.04, // First bracket
      pstRate: 0, // No PST
      gstRate: this.GST_RATE,
      hstRate: 0,
      usesHST: false,
      employerHealthTax: {
        applicable: true,
        thresholds: [
          { maxPayroll: Infinity, rate: 0.02 },
        ],
      },
      wcbRates: [
        { industryCode: 'healthcare', baseRate: 0.68, description: 'Healthcare services' },
        { industryCode: 'homecare', baseRate: 1.12, description: 'Home care services' },
      ],
    }],
  ]);

  /**
   * Get tax rules for a province
   */
  getTaxRules(province: CanadianProvince): ProvincialTaxRules {
    const rules = this.taxRules.get(province);
    if (!rules) {
      return this.taxRules.get(CanadianProvince.ON)!;
    }
    return rules;
  }

  /**
   * Calculate sales tax for a province
   */
  calculateSalesTax(province: CanadianProvince, amount: number): {
    gst: number;
    pst: number;
    hst: number;
    total: number;
    totalWithTax: number;
  } {
    const rules = this.getTaxRules(province);

    if (rules.usesHST) {
      const hst = amount * rules.hstRate;
      return {
        gst: 0,
        pst: 0,
        hst,
        total: hst,
        totalWithTax: amount + hst,
      };
    }

    const gst = amount * rules.gstRate;
    const pst = amount * rules.pstRate;
    return {
      gst,
      pst,
      hst: 0,
      total: gst + pst,
      totalWithTax: amount + gst + pst,
    };
  }

  /**
   * Calculate employer health tax
   */
  calculateEmployerHealthTax(province: CanadianProvince, annualPayroll: number): {
    applicable: boolean;
    rate: number;
    amount: number;
  } {
    const rules = this.getTaxRules(province);

    if (!rules.employerHealthTax.applicable) {
      return { applicable: false, rate: 0, amount: 0 };
    }

    let applicableRate = 0;
    for (const threshold of rules.employerHealthTax.thresholds) {
      if (annualPayroll <= threshold.maxPayroll) {
        applicableRate = threshold.rate;
        break;
      }
    }

    return {
      applicable: true,
      rate: applicableRate,
      amount: annualPayroll * applicableRate,
    };
  }

  /**
   * Get WCB rate for industry
   */
  getWCBRate(province: CanadianProvince, industryCode: string): {
    rate: number;
    description: string;
  } {
    const rules = this.getTaxRules(province);
    const wcb = rules.wcbRates.find((r) => r.industryCode === industryCode);

    if (!wcb) {
      // Default to homecare rate
      const homecare = rules.wcbRates.find((r) => r.industryCode === 'homecare');
      return homecare ? { rate: homecare.baseRate, description: homecare.description } : { rate: 1.0, description: 'Default rate' };
    }

    return { rate: wcb.baseRate, description: wcb.description };
  }

  /**
   * Get all tax rules summary
   */
  getAllTaxRulesSummary(): Array<{
    province: CanadianProvince;
    hstRate: number;
    pstRate: number;
    gstRate: number;
    usesHST: boolean;
    hasEmployerHealthTax: boolean;
  }> {
    return Array.from(this.taxRules.values()).map((rules) => ({
      province: rules.province,
      hstRate: rules.hstRate,
      pstRate: rules.pstRate,
      gstRate: rules.gstRate,
      usesHST: rules.usesHST,
      hasEmployerHealthTax: rules.employerHealthTax.applicable,
    }));
  }
}


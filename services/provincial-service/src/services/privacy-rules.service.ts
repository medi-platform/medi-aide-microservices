import { Injectable, Logger } from '@nestjs/common';
import {
  CanadianProvince,
  PrivacyLegislation,
  ProvincialPrivacyRequirements,
} from '../interfaces/provincial.interface';

/**
 * Privacy Rules Service
 * Canadian provincial privacy legislation compliance
 */
@Injectable()
export class PrivacyRulesService {
  private readonly logger = new Logger(PrivacyRulesService.name);

  // Provincial privacy requirements
  private readonly privacyRules: Map<CanadianProvince, ProvincialPrivacyRequirements> = new Map([
    [CanadianProvince.ON, {
      province: CanadianProvince.ON,
      legislation: PrivacyLegislation.PHIPA,
      legislationName: 'Personal Health Information Protection Act',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 1,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: false,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must appoint a Privacy Officer',
        'Privacy impact assessments required for new systems',
        'Annual privacy training for all staff',
        'Maintain audit trail for all health record access',
        'Must store data in Canada',
      ],
    }],
    [CanadianProvince.BC, {
      province: CanadianProvince.BC,
      legislation: PrivacyLegislation.PIPA_BC,
      legislationName: 'Personal Information Protection Act (BC)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 3,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must designate privacy contact',
        'Privacy policies must be publicly available',
        'Notify Commissioner of serious breaches',
      ],
    }],
    [CanadianProvince.AB, {
      province: CanadianProvince.AB,
      legislation: PrivacyLegislation.HIA,
      legislationName: 'Health Information Act',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: false,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must register with Alberta Health Information Commissioner',
        'Affiliate agreements required for contractors',
        'Data must be stored in Canada',
      ],
    }],
    [CanadianProvince.QC, {
      province: CanadianProvince.QC,
      legislation: PrivacyLegislation.LPRPSP,
      legislationName: "Law Respecting the Protection of Personal Information in the Private Sector",
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 0, // Immediate
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 7,
        crossBorderTransferAllowed: false,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must appoint a Chief Privacy Officer',
        'Privacy impact assessments mandatory',
        'French language requirements for all privacy notices',
        'Consent must be in French if individual is French-speaking',
        'Data must be stored in Quebec or Canada',
        'Law 25 compliance required (enhanced privacy obligations)',
      ],
    }],
    [CanadianProvince.MB, {
      province: CanadianProvince.MB,
      legislation: PrivacyLegislation.PHIA_MB,
      legislationName: 'Personal Health Information Act (Manitoba)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: false,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must maintain registry of health information banks',
        'Written agreements required with information managers',
      ],
    }],
    [CanadianProvince.SK, {
      province: CanadianProvince.SK,
      legislation: PrivacyLegislation.HIPA,
      legislationName: 'Health Information Protection Act',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: false,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must notify Saskatchewan Information and Privacy Commissioner of breaches',
        'Data localization required',
      ],
    }],
    [CanadianProvince.NS, {
      province: CanadianProvince.NS,
      legislation: PrivacyLegislation.PHIA_NS,
      legislationName: 'Personal Health Information Act (Nova Scotia)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Must have written information management practices',
      ],
    }],
    [CanadianProvince.NB, {
      province: CanadianProvince.NB,
      legislation: PrivacyLegislation.PHIA_NB,
      legislationName: 'Personal Health Information Privacy and Access Act',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Bilingual privacy notices required',
      ],
    }],
    [CanadianProvince.NL, {
      province: CanadianProvince.NL,
      legislation: PrivacyLegislation.PHIA_NL,
      legislationName: 'Personal Health Information Act (Newfoundland)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 10,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [],
    }],
    [CanadianProvince.PE, {
      province: CanadianProvince.PE,
      legislation: PrivacyLegislation.PIPEDA,
      legislationName: 'Personal Information Protection and Electronic Documents Act (Federal)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 7,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Follows federal PIPEDA requirements',
      ],
    }],
    [CanadianProvince.NT, {
      province: CanadianProvince.NT,
      legislation: PrivacyLegislation.PIPEDA,
      legislationName: 'Personal Information Protection and Electronic Documents Act (Federal)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 7,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Follows federal PIPEDA requirements',
      ],
    }],
    [CanadianProvince.YT, {
      province: CanadianProvince.YT,
      legislation: PrivacyLegislation.PIPEDA,
      legislationName: 'Personal Information Protection and Electronic Documents Act (Federal)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 7,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Follows federal PIPEDA requirements',
      ],
    }],
    [CanadianProvince.NU, {
      province: CanadianProvince.NU,
      legislation: PrivacyLegislation.PIPEDA,
      legislationName: 'Personal Information Protection and Electronic Documents Act (Federal)',
      requirements: {
        consentRequired: true,
        explicitConsentForHealthData: true,
        dataBreachNotificationRequired: true,
        dataBreachNotificationTimeframeDays: 5,
        rightToAccess: true,
        rightToCorrection: true,
        rightToWithdrawConsent: true,
        dataRetentionMaxYears: 7,
        crossBorderTransferAllowed: true,
        crossBorderTransferRequiresConsent: true,
      },
      additionalRequirements: [
        'Follows federal PIPEDA requirements',
        'Indigenous data sovereignty considerations',
      ],
    }],
  ]);

  /**
   * Get privacy requirements for a province
   */
  getPrivacyRequirements(province: CanadianProvince): ProvincialPrivacyRequirements {
    const requirements = this.privacyRules.get(province);
    if (!requirements) {
      // Default to PIPEDA
      return {
        province,
        legislation: PrivacyLegislation.PIPEDA,
        legislationName: 'Personal Information Protection and Electronic Documents Act',
        requirements: {
          consentRequired: true,
          explicitConsentForHealthData: true,
          dataBreachNotificationRequired: true,
          dataBreachNotificationTimeframeDays: 5,
          rightToAccess: true,
          rightToCorrection: true,
          rightToWithdrawConsent: true,
          dataRetentionMaxYears: 7,
          crossBorderTransferAllowed: true,
          crossBorderTransferRequiresConsent: true,
        },
        additionalRequirements: [],
      };
    }
    return requirements;
  }

  /**
   * Check if data can be transferred cross-border
   */
  canTransferCrossBorder(province: CanadianProvince, hasConsent: boolean): {
    allowed: boolean;
    reason: string;
  } {
    const requirements = this.getPrivacyRequirements(province);

    if (!requirements.requirements.crossBorderTransferAllowed) {
      return {
        allowed: false,
        reason: `${requirements.legislationName} prohibits cross-border data transfer for health information`,
      };
    }

    if (requirements.requirements.crossBorderTransferRequiresConsent && !hasConsent) {
      return {
        allowed: false,
        reason: 'Cross-border transfer requires explicit consent',
      };
    }

    return {
      allowed: true,
      reason: 'Cross-border transfer permitted with current consent status',
    };
  }

  /**
   * Get data breach notification requirements
   */
  getBreachNotificationRequirements(province: CanadianProvince): {
    required: boolean;
    timeframeDays: number;
    notifyCommissioner: boolean;
    notifyIndividuals: boolean;
    legislation: string;
  } {
    const requirements = this.getPrivacyRequirements(province);

    return {
      required: requirements.requirements.dataBreachNotificationRequired,
      timeframeDays: requirements.requirements.dataBreachNotificationTimeframeDays,
      notifyCommissioner: true,
      notifyIndividuals: true,
      legislation: requirements.legislationName,
    };
  }

  /**
   * Get data retention policy for province
   */
  getRetentionPolicy(province: CanadianProvince): {
    maxYears: number;
    legislation: string;
    notes: string[];
  } {
    const requirements = this.getPrivacyRequirements(province);

    return {
      maxYears: requirements.requirements.dataRetentionMaxYears,
      legislation: requirements.legislationName,
      notes: [
        'Retention period may vary based on record type',
        'Minors records may require longer retention',
        'Legal holds may extend retention period',
      ],
    };
  }

  /**
   * Get all privacy requirements summary
   */
  getAllPrivacyRequirementsSummary(): Array<{
    province: CanadianProvince;
    legislation: PrivacyLegislation;
    crossBorderAllowed: boolean;
    breachNotificationDays: number;
    retentionYears: number;
  }> {
    return Array.from(this.privacyRules.values()).map((req) => ({
      province: req.province,
      legislation: req.legislation,
      crossBorderAllowed: req.requirements.crossBorderTransferAllowed,
      breachNotificationDays: req.requirements.dataBreachNotificationTimeframeDays,
      retentionYears: req.requirements.dataRetentionMaxYears,
    }));
  }
}


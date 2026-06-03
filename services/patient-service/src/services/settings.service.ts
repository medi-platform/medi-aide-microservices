import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PatientSettings,
  CommunicationPreference,
  PrivacyLevel,
} from '../entities/patient-settings.entity';

interface UpdateSettingsDto {
  communicationPreference?: CommunicationPreference;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  profileVisibility?: PrivacyLevel;
  shareHealthDataWithFamily?: boolean;
  allowAnonymousMatching?: boolean;
  preferredCaregiverGender?: 'male' | 'female' | 'no_preference';
  preferredLanguages?: string[];
  requireBackgroundCheck?: boolean;
  requireCertification?: boolean;
  preferredVisitTimes?: PatientSettings['preferredVisitTimes'];
  minVisitDurationMinutes?: number;
  maxVisitDurationMinutes?: number;
  accessibilityNeeds?: string[];
  specialInstructions?: string;
  dataRetentionDays?: number;
  autoDeleteOldData?: boolean;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(PatientSettings)
    private readonly settingsRepo: Repository<PatientSettings>,
  ) {}

  /**
   * Get or create settings for a patient
   */
  async getSettings(patientId: string): Promise<PatientSettings> {
    let settings = await this.settingsRepo.findOne({
      where: { patientId },
    });

    if (!settings) {
      settings = await this.createDefaultSettings(patientId);
    }

    return settings;
  }

  /**
   * Update patient settings
   */
  async updateSettings(
    patientId: string,
    dto: UpdateSettingsDto,
  ): Promise<PatientSettings> {
    let settings = await this.settingsRepo.findOne({
      where: { patientId },
    });

    if (!settings) {
      settings = await this.createDefaultSettings(patientId);
    }

    Object.assign(settings, dto);
    await this.settingsRepo.save(settings);

    this.logger.log(`Settings updated for patient ${patientId}`);

    return settings;
  }

  /**
   * Get communication preferences
   */
  async getCommunicationPreferences(
    patientId: string,
  ): Promise<{
    preference: CommunicationPreference;
    email: boolean;
    sms: boolean;
    push: boolean;
  }> {
    const settings = await this.getSettings(patientId);

    return {
      preference: settings.communicationPreference,
      email: settings.emailNotifications,
      sms: settings.smsNotifications,
      push: settings.pushNotifications,
    };
  }

  /**
   * Get caregiver preferences
   */
  async getCaregiverPreferences(
    patientId: string,
  ): Promise<{
    preferredGender?: string;
    preferredLanguages?: string[];
    requireBackgroundCheck: boolean;
    requireCertification: boolean;
  }> {
    const settings = await this.getSettings(patientId);

    return {
      preferredGender: settings.preferredCaregiverGender,
      preferredLanguages: settings.preferredLanguages,
      requireBackgroundCheck: settings.requireBackgroundCheck,
      requireCertification: settings.requireCertification,
    };
  }

  /**
   * Get scheduling preferences
   */
  async getSchedulingPreferences(
    patientId: string,
  ): Promise<{
    preferredVisitTimes?: PatientSettings['preferredVisitTimes'];
    minDurationMinutes: number;
    maxDurationMinutes: number;
  }> {
    const settings = await this.getSettings(patientId);

    return {
      preferredVisitTimes: settings.preferredVisitTimes,
      minDurationMinutes: settings.minVisitDurationMinutes,
      maxDurationMinutes: settings.maxVisitDurationMinutes,
    };
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(patientId: string): Promise<PatientSettings> {
    const existing = await this.settingsRepo.findOne({
      where: { patientId },
    });

    if (existing) {
      await this.settingsRepo.remove(existing);
    }

    return this.createDefaultSettings(patientId);
  }

  /**
   * Create default settings for a patient
   */
  private async createDefaultSettings(patientId: string): Promise<PatientSettings> {
    const settings = this.settingsRepo.create({
      patientId,
      communicationPreference: CommunicationPreference.ALL,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      profileVisibility: PrivacyLevel.CARE_TEAM,
      shareHealthDataWithFamily: false,
      allowAnonymousMatching: true,
      requireBackgroundCheck: true,
      requireCertification: true,
      minVisitDurationMinutes: 60,
      maxVisitDurationMinutes: 480,
      dataRetentionDays: 365,
      autoDeleteOldData: false,
    });

    await this.settingsRepo.save(settings);

    this.logger.log(`Default settings created for patient ${patientId}`);

    return settings;
  }
}


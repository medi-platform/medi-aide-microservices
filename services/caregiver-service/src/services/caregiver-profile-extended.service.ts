import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverLanguage, LanguageProficiency } from '../entities/caregiver-language.entity';
import { CaregiverWorkZone, ZonePreference } from '../entities/caregiver-work-zone.entity';
import { CaregiverEquipment, EquipmentStatus } from '../entities/caregiver-equipment.entity';
import { CaregiverEmergencyContact } from '../entities/caregiver-emergency-contact.entity';
import { CaregiverNotificationPreference } from '../entities/caregiver-notification-preference.entity';
import { CaregiverFeedback, FeedbackSentiment } from '../entities/caregiver-feedback.entity';
import { CaregiverPatient } from '../entities/caregiver-patient.entity';
import { CaregiverReference, ReferenceStatus } from '../entities/caregiver-reference.entity';

@Injectable()
export class CaregiverProfileExtendedService {
  constructor(
    @InjectRepository(CaregiverLanguage)
    private readonly languageRepository: Repository<CaregiverLanguage>,
    @InjectRepository(CaregiverWorkZone)
    private readonly workZoneRepository: Repository<CaregiverWorkZone>,
    @InjectRepository(CaregiverEquipment)
    private readonly equipmentRepository: Repository<CaregiverEquipment>,
    @InjectRepository(CaregiverEmergencyContact)
    private readonly emergencyContactRepository: Repository<CaregiverEmergencyContact>,
    @InjectRepository(CaregiverNotificationPreference)
    private readonly notificationPrefRepository: Repository<CaregiverNotificationPreference>,
    @InjectRepository(CaregiverFeedback)
    private readonly feedbackRepository: Repository<CaregiverFeedback>,
    @InjectRepository(CaregiverPatient)
    private readonly patientRepository: Repository<CaregiverPatient>,
    @InjectRepository(CaregiverReference)
    private readonly referenceRepository: Repository<CaregiverReference>,
  ) {}

  // ===== LANGUAGES =====

  async addLanguage(data: Partial<CaregiverLanguage>): Promise<CaregiverLanguage> {
    // If setting as primary, unset others
    if (data.isPrimary) {
      await this.languageRepository.update(
        { caregiverId: data.caregiverId, isPrimary: true },
        { isPrimary: false },
      );
    }
    const language = this.languageRepository.create(data);
    return this.languageRepository.save(language);
  }

  async updateLanguage(id: string, data: Partial<CaregiverLanguage>): Promise<CaregiverLanguage> {
    const language = await this.languageRepository.findOne({ where: { id } });
    if (!language) {
      throw new NotFoundException(`Language ${id} not found`);
    }
    Object.assign(language, data);
    return this.languageRepository.save(language);
  }

  async deleteLanguage(id: string): Promise<void> {
    await this.languageRepository.delete(id);
  }

  async listCaregiverLanguages(caregiverId: string): Promise<CaregiverLanguage[]> {
    return this.languageRepository.find({
      where: { caregiverId },
      order: { isPrimary: 'DESC', proficiency: 'DESC' },
    });
  }

  // ===== WORK ZONES =====

  async addWorkZone(data: Partial<CaregiverWorkZone>): Promise<CaregiverWorkZone> {
    const zone = this.workZoneRepository.create(data);
    return this.workZoneRepository.save(zone);
  }

  async updateWorkZone(id: string, data: Partial<CaregiverWorkZone>): Promise<CaregiverWorkZone> {
    const zone = await this.workZoneRepository.findOne({ where: { id } });
    if (!zone) {
      throw new NotFoundException(`Work zone ${id} not found`);
    }
    Object.assign(zone, data);
    return this.workZoneRepository.save(zone);
  }

  async deleteWorkZone(id: string): Promise<void> {
    await this.workZoneRepository.delete(id);
  }

  async listCaregiverWorkZones(caregiverId: string): Promise<CaregiverWorkZone[]> {
    return this.workZoneRepository.find({
      where: { caregiverId, isActive: true },
      order: { preference: 'ASC' },
    });
  }

  // ===== EQUIPMENT =====

  async assignEquipment(data: Partial<CaregiverEquipment>): Promise<CaregiverEquipment> {
    const equipment = this.equipmentRepository.create(data);
    return this.equipmentRepository.save(equipment);
  }

  async updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<CaregiverEquipment> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment ${id} not found`);
    }
    equipment.status = status;
    if (status === EquipmentStatus.RETURNED) {
      equipment.returnedDate = new Date();
    }
    return this.equipmentRepository.save(equipment);
  }

  async listCaregiverEquipment(caregiverId: string): Promise<CaregiverEquipment[]> {
    return this.equipmentRepository.find({
      where: { caregiverId },
      order: { assignedDate: 'DESC' },
    });
  }

  // ===== EMERGENCY CONTACTS =====

  async addEmergencyContact(data: Partial<CaregiverEmergencyContact>): Promise<CaregiverEmergencyContact> {
    // If setting as primary, unset others
    if (data.isPrimary) {
      await this.emergencyContactRepository.update(
        { caregiverId: data.caregiverId, isPrimary: true },
        { isPrimary: false },
      );
    }
    const contact = this.emergencyContactRepository.create(data);
    return this.emergencyContactRepository.save(contact);
  }

  async updateEmergencyContact(
    id: string,
    data: Partial<CaregiverEmergencyContact>,
  ): Promise<CaregiverEmergencyContact> {
    const contact = await this.emergencyContactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Emergency contact ${id} not found`);
    }
    Object.assign(contact, data);
    return this.emergencyContactRepository.save(contact);
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    await this.emergencyContactRepository.delete(id);
  }

  async listEmergencyContacts(caregiverId: string): Promise<CaregiverEmergencyContact[]> {
    return this.emergencyContactRepository.find({
      where: { caregiverId },
      order: { isPrimary: 'DESC', contactOrder: 'ASC' },
    });
  }

  // ===== NOTIFICATION PREFERENCES =====

  async getNotificationPreferences(caregiverId: string): Promise<CaregiverNotificationPreference | null> {
    return this.notificationPrefRepository.findOne({ where: { caregiverId } });
  }

  async updateNotificationPreferences(
    caregiverId: string,
    data: Partial<CaregiverNotificationPreference>,
  ): Promise<CaregiverNotificationPreference> {
    let prefs = await this.notificationPrefRepository.findOne({ where: { caregiverId } });
    if (!prefs) {
      prefs = this.notificationPrefRepository.create({ caregiverId });
    }
    Object.assign(prefs, data);
    return this.notificationPrefRepository.save(prefs);
  }

  // ===== FEEDBACK =====

  async submitFeedback(data: Partial<CaregiverFeedback>): Promise<CaregiverFeedback> {
    // Auto-determine sentiment based on overall rating
    if (data.overallRating) {
      if (data.overallRating >= 4) {
        data.sentiment = FeedbackSentiment.POSITIVE;
      } else if (data.overallRating <= 2) {
        data.sentiment = FeedbackSentiment.NEGATIVE;
      } else {
        data.sentiment = FeedbackSentiment.NEUTRAL;
      }
    }
    const feedback = this.feedbackRepository.create(data);
    return this.feedbackRepository.save(feedback);
  }

  async getFeedback(id: string): Promise<CaregiverFeedback> {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }
    return feedback;
  }

  async respondToFeedback(id: string, response: string): Promise<CaregiverFeedback> {
    const feedback = await this.getFeedback(id);
    feedback.caregiverResponse = response;
    feedback.respondedAt = new Date();
    return this.feedbackRepository.save(feedback);
  }

  async listCaregiverFeedback(caregiverId: string): Promise<CaregiverFeedback[]> {
    return this.feedbackRepository.find({
      where: { caregiverId },
      order: { feedbackDate: 'DESC' },
    });
  }

  async getCaregiverAverageRating(caregiverId: string): Promise<number> {
    const result = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .select('AVG(feedback.overallRating)', 'avg')
      .where('feedback.caregiverId = :caregiverId', { caregiverId })
      .getRawOne();
    return result?.avg ? parseFloat(result.avg) : 0;
  }

  // ===== CARE RECIPIENT RELATIONSHIPS =====

  async assignPatient(data: Partial<CaregiverPatient>): Promise<CaregiverPatient> {
    const relationship = this.patientRepository.create(data);
    return this.patientRepository.save(relationship);
  }

  async endPatientRelationship(id: string): Promise<CaregiverPatient> {
    const relationship = await this.patientRepository.findOne({ where: { id } });
    if (!relationship) {
      throw new NotFoundException(`Care recipient relationship ${id} not found`);
    }
    relationship.end_date = new Date();
    return this.patientRepository.save(relationship);
  }

  async listCaregiverPatients(caregiverId: string): Promise<CaregiverPatient[]> {
    return this.patientRepository.find({
      where: { caregiver_id: caregiverId },
      order: { start_date: 'DESC' },
    });
  }

  async listActivePatients(caregiverId: string): Promise<CaregiverPatient[]> {
    return this.patientRepository
      .createQueryBuilder('cp')
      .where('cp.caregiver_id = :caregiverId', { caregiverId })
      .andWhere('cp.end_date IS NULL')
      .orderBy('cp.start_date', 'DESC')
      .getMany();
  }

  // ===== REFERENCES =====

  async addReference(data: Partial<CaregiverReference>): Promise<CaregiverReference> {
    const reference = this.referenceRepository.create(data);
    return this.referenceRepository.save(reference);
  }

  async updateReferenceStatus(id: string, status: string, feedback?: string): Promise<CaregiverReference> {
    const reference = await this.referenceRepository.findOne({ where: { id } });
    if (!reference) {
      throw new NotFoundException(`Reference ${id} not found`);
    }
    reference.status = status as ReferenceStatus;
    if (feedback) {
      reference.reference_response = feedback;
    }
    return this.referenceRepository.save(reference);
  }

  async listCaregiverReferences(caregiverId: string): Promise<CaregiverReference[]> {
    return this.referenceRepository.find({
      where: { caregiver_id: caregiverId },
      order: { created_at: 'DESC' },
    });
  }
}

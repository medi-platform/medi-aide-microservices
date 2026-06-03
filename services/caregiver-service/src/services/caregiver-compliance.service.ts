import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { CaregiverCompliance, ComplianceStatus } from '../entities/caregiver-compliance.entity';
import { CaregiverIncident, IncidentStatus, IncidentSeverity } from '../entities/caregiver-incident.entity';
import { CaregiverNote, CaregiverNoteCategory } from '../entities/caregiver-note.entity';
import { CaregiverConsent, ConsentType } from '../entities/caregiver-consent.entity';

@Injectable()
export class CaregiverComplianceService {
  constructor(
    @InjectRepository(CaregiverCompliance)
    private readonly complianceRepository: Repository<CaregiverCompliance>,
    @InjectRepository(CaregiverIncident)
    private readonly incidentRepository: Repository<CaregiverIncident>,
    @InjectRepository(CaregiverNote)
    private readonly noteRepository: Repository<CaregiverNote>,
    @InjectRepository(CaregiverConsent)
    private readonly consentRepository: Repository<CaregiverConsent>,
  ) {}

  // ===== COMPLIANCE REQUIREMENTS =====

  async createComplianceRequirement(data: Partial<CaregiverCompliance>): Promise<CaregiverCompliance> {
    const compliance = this.complianceRepository.create(data);
    return this.complianceRepository.save(compliance);
  }

  async getComplianceRequirement(id: string): Promise<CaregiverCompliance> {
    const compliance = await this.complianceRepository.findOne({ where: { id } });
    if (!compliance) {
      throw new NotFoundException(`Compliance requirement ${id} not found`);
    }
    return compliance;
  }

  async updateComplianceStatus(
    id: string,
    status: ComplianceStatus,
    verifiedBy?: string,
    notes?: string,
  ): Promise<CaregiverCompliance> {
    const compliance = await this.getComplianceRequirement(id);
    compliance.status = status;
    if (verifiedBy) {
      compliance.verifiedBy = verifiedBy;
      compliance.verifiedAt = new Date();
    }
    if (notes) {
      compliance.verificationNotes = notes;
    }
    return this.complianceRepository.save(compliance);
  }

  async listCaregiverCompliance(
    caregiverId: string,
    status?: ComplianceStatus,
  ): Promise<CaregiverCompliance[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.complianceRepository.find({
      where,
      order: { expiryDate: 'ASC' },
    });
  }

  async getExpiringCompliance(
    caregiverId: string,
    daysAhead: number = 30,
  ): Promise<CaregiverCompliance[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.complianceRepository.find({
      where: {
        caregiverId,
        expiryDate: Between(new Date(), futureDate),
        status: ComplianceStatus.COMPLIANT,
      },
      order: { expiryDate: 'ASC' },
    });
  }

  async getComplianceSummary(caregiverId: string): Promise<{
    total: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
    expiringSoon: number;
    expired: number;
  }> {
    const all = await this.complianceRepository.find({
      where: { caregiverId },
    });

    return {
      total: all.length,
      compliant: all.filter(c => c.status === ComplianceStatus.COMPLIANT).length,
      nonCompliant: all.filter(c => c.status === ComplianceStatus.NON_COMPLIANT).length,
      pending: all.filter(c => c.status === ComplianceStatus.PENDING).length,
      expiringSoon: all.filter(c => c.status === ComplianceStatus.EXPIRING_SOON).length,
      expired: all.filter(c => c.status === ComplianceStatus.EXPIRED).length,
    };
  }

  // ===== INCIDENTS =====

  async reportIncident(data: Partial<CaregiverIncident>): Promise<CaregiverIncident> {
    const incident = this.incidentRepository.create({
      ...data,
      status: IncidentStatus.REPORTED,
      reportedAt: new Date(),
    });
    return this.incidentRepository.save(incident);
  }

  async getIncident(id: string): Promise<CaregiverIncident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }
    return incident;
  }

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    notes?: string,
  ): Promise<CaregiverIncident> {
    const incident = await this.getIncident(id);
    incident.status = status;
    if (notes) {
      incident.investigationNotes = incident.investigationNotes
        ? `${incident.investigationNotes}\n\n${notes}`
        : notes;
    }
    if (status === IncidentStatus.RESOLVED) {
      incident.resolvedAt = new Date();
    }
    return this.incidentRepository.save(incident);
  }

  async assignInvestigator(id: string, investigatorId: string): Promise<CaregiverIncident> {
    const incident = await this.getIncident(id);
    incident.assignedInvestigator = investigatorId;
    incident.status = IncidentStatus.INVESTIGATING;
    return this.incidentRepository.save(incident);
  }

  async resolveIncident(id: string, summary: string): Promise<CaregiverIncident> {
    const incident = await this.getIncident(id);
    incident.status = IncidentStatus.RESOLVED;
    incident.resolutionSummary = summary;
    incident.resolvedAt = new Date();
    return this.incidentRepository.save(incident);
  }

  async listCaregiverIncidents(
    caregiverId: string,
    status?: IncidentStatus,
  ): Promise<CaregiverIncident[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.incidentRepository.find({
      where,
      order: { incidentDate: 'DESC' },
    });
  }

  async listOpenIncidents(agencyId?: string): Promise<CaregiverIncident[]> {
    const where: any = {
      status: IncidentStatus.REPORTED,
    };
    if (agencyId) {
      where.agencyId = agencyId;
    }
    return this.incidentRepository.find({
      where,
      order: { severity: 'DESC', incidentDate: 'ASC' },
    });
  }

  // ===== NOTES =====

  async createNote(data: Partial<CaregiverNote>): Promise<CaregiverNote> {
    const note = this.noteRepository.create(data);
    return this.noteRepository.save(note);
  }

  async getNote(id: string): Promise<CaregiverNote> {
    const note = await this.noteRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note ${id} not found`);
    }
    return note;
  }

  async updateNote(id: string, data: Partial<CaregiverNote>): Promise<CaregiverNote> {
    const note = await this.getNote(id);
    Object.assign(note, data);
    return this.noteRepository.save(note);
  }

  async acknowledgeNote(id: string): Promise<CaregiverNote> {
    const note = await this.getNote(id);
    note.acknowledgedAt = new Date();
    return this.noteRepository.save(note);
  }

  async listCaregiverNotes(
    caregiverId: string,
    category?: CaregiverNoteCategory,
  ): Promise<CaregiverNote[]> {
    const where: any = { caregiverId };
    if (category) {
      where.category = category;
    }
    return this.noteRepository.find({
      where,
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  // ===== CONSENTS =====

  async recordConsent(data: Partial<CaregiverConsent>): Promise<CaregiverConsent> {
    const consent = this.consentRepository.create({
      ...data,
      granted_at: new Date(),
    });
    return this.consentRepository.save(consent);
  }

  async getConsent(id: string): Promise<CaregiverConsent> {
    const consent = await this.consentRepository.findOne({ where: { id } });
    if (!consent) {
      throw new NotFoundException(`Consent record ${id} not found`);
    }
    return consent;
  }

  async revokeConsent(id: string): Promise<CaregiverConsent> {
    const consent = await this.getConsent(id);
    consent.expires_at = new Date();
    consent.metadata = { ...consent.metadata, revokedAt: new Date().toISOString() };
    return this.consentRepository.save(consent);
  }

  async listCaregiverConsents(caregiverId: string): Promise<CaregiverConsent[]> {
    return this.consentRepository.find({
      where: { caregiver_id: caregiverId },
      order: { granted_at: 'DESC' },
    });
  }

  async hasValidConsent(caregiverId: string, consentType: string): Promise<boolean> {
    const consent = await this.consentRepository.findOne({
      where: {
        caregiver_id: caregiverId,
        consent_type: consentType as ConsentType,
      },
      order: { granted_at: 'DESC' },
    });

    if (!consent) return false;
    if (consent.expires_at && consent.expires_at < new Date()) return false;
    return true;
  }
}

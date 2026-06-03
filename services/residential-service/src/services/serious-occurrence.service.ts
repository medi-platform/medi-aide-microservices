/**
 * Serious Occurrence Service
 * Business logic for managing serious occurrences (Canadian regulatory requirements)
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SeriousOccurrence } from '../entities/serious-occurrence.entity';
import { OccurrenceType, OccurrenceSeverity, OccurrenceStatus } from '../interfaces/residential.interface';

export interface CreateSeriousOccurrenceDto {
  residence_id: string;
  resident_id?: string;
  resident_name?: string;
  occurrence_type: OccurrenceType;
  severity: OccurrenceSeverity;
  occurrence_date: Date;
  occurrence_time: Date;
  location_in_facility?: string;
  description: string;
  immediate_actions_taken?: string;
  witnesses?: Array<{
    name: string;
    role: string;
    contactInfo?: string;
    statement?: string;
  }>;
  staff_involved?: Array<{
    userId: string;
    name: string;
    role: string;
    involvement: string;
  }>;
  reported_by_id: string;
  reported_by_name?: string;
  medical_attention_required?: boolean;
  hospitalization_required?: boolean;
}

export interface UpdateSeriousOccurrenceDto {
  status?: OccurrenceStatus;
  ministry_reference_number?: string;
  investigation_findings?: string;
  root_cause_analysis?: string;
  corrective_actions?: Array<{
    action: string;
    assignedTo: string;
    dueDate: Date;
    status: string;
    completedAt?: Date;
  }>;
  closure_summary?: string;
}

@Injectable()
export class SeriousOccurrenceService {
  constructor(
    @InjectRepository(SeriousOccurrence)
    private readonly occurrenceRepository: Repository<SeriousOccurrence>,
  ) {}

  async create(dto: CreateSeriousOccurrenceDto): Promise<SeriousOccurrence> {
    const occurrence = this.occurrenceRepository.create({
      ...dto,
      status: OccurrenceStatus.REPORTED,
      reported_at: new Date(),
      // Determine if ministry reportable based on type and severity
      ministry_reportable: this.isMinistryReportable(dto.occurrence_type, dto.severity),
    });

    // Set ministry report due date (usually 1 business day for critical, 3 for serious)
    if (occurrence.ministry_reportable) {
      const dueDate = new Date();
      if (dto.severity === OccurrenceSeverity.CRITICAL) {
        dueDate.setHours(dueDate.getHours() + 24);
      } else {
        dueDate.setDate(dueDate.getDate() + 3);
      }
      occurrence.ministry_report_due = dueDate;
    }

    return this.occurrenceRepository.save(occurrence);
  }

  private isMinistryReportable(type: OccurrenceType, severity: OccurrenceSeverity): boolean {
    // Critical incidents are always reportable
    if (severity === OccurrenceSeverity.CRITICAL) return true;

    // Certain types are always reportable regardless of severity
    const alwaysReportable = [
      OccurrenceType.DEATH,
      OccurrenceType.ABUSE_ALLEGATION,
      OccurrenceType.ELOPEMENT,
      OccurrenceType.DISEASE_OUTBREAK,
    ];

    if (alwaysReportable.includes(type)) return true;

    // Serious severity for other types
    return severity === OccurrenceSeverity.SERIOUS;
  }

  async findById(id: string): Promise<SeriousOccurrence> {
    const occurrence = await this.occurrenceRepository.findOne({ where: { id } });
    if (!occurrence) {
      throw new NotFoundException(`Serious occurrence with ID ${id} not found`);
    }
    return occurrence;
  }

  async update(id: string, dto: UpdateSeriousOccurrenceDto): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);
    Object.assign(occurrence, dto);
    return this.occurrenceRepository.save(occurrence);
  }

  async startInvestigation(id: string, investigatorId: string, investigatorName: string): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);
    
    occurrence.status = OccurrenceStatus.UNDER_INVESTIGATION;
    occurrence.investigation_required = true;
    occurrence.investigator_id = investigatorId;
    occurrence.investigator_name = investigatorName;
    occurrence.investigation_started_at = new Date();

    return this.occurrenceRepository.save(occurrence);
  }

  async submitToMinistry(id: string, submittedBy: string, referenceNumber?: string): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);

    if (!occurrence.ministry_reportable) {
      throw new BadRequestException('This occurrence is not ministry reportable');
    }

    occurrence.status = OccurrenceStatus.SUBMITTED_TO_MINISTRY;
    occurrence.ministry_submitted_at = new Date();
    occurrence.ministry_submitted_by = submittedBy;
    if (referenceNumber) {
      occurrence.ministry_reference_number = referenceNumber;
    }

    return this.occurrenceRepository.save(occurrence);
  }

  async addMinistryResponse(id: string, response: string): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);
    occurrence.ministry_response = response;
    return this.occurrenceRepository.save(occurrence);
  }

  async completeInvestigation(
    id: string,
    findings: string,
    rootCauseAnalysis: string,
    correctiveActions: Array<{
      action: string;
      assignedTo: string;
      dueDate: Date;
      status: string;
    }>,
  ): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);

    occurrence.investigation_completed_at = new Date();
    occurrence.investigation_findings = findings;
    occurrence.root_cause_analysis = rootCauseAnalysis;
    occurrence.corrective_actions = correctiveActions;

    return this.occurrenceRepository.save(occurrence);
  }

  async notifyFamily(id: string, notifiedBy: string): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);

    occurrence.family_notified = true;
    occurrence.family_notified_at = new Date();
    occurrence.family_notified_by = notifiedBy;

    return this.occurrenceRepository.save(occurrence);
  }

  async recordFamilyResponse(id: string, response: string): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);
    occurrence.family_response = response;
    return this.occurrenceRepository.save(occurrence);
  }

  async updateCorrectiveActionStatus(
    id: string,
    actionIndex: number,
    status: string,
    completedAt?: Date,
  ): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);

    if (actionIndex < 0 || actionIndex >= occurrence.corrective_actions.length) {
      throw new BadRequestException('Invalid corrective action index');
    }

    occurrence.corrective_actions[actionIndex].status = status;
    if (completedAt) {
      occurrence.corrective_actions[actionIndex].completedAt = completedAt;
    }

    return this.occurrenceRepository.save(occurrence);
  }

  async close(id: string, closedBy: string, summary: string): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);

    // Validate all corrective actions are complete
    const pendingActions = occurrence.corrective_actions.filter(
      (a) => a.status !== 'completed'
    );
    if (pendingActions.length > 0) {
      throw new BadRequestException('All corrective actions must be completed before closing');
    }

    occurrence.status = OccurrenceStatus.CLOSED;
    occurrence.closed_by = closedBy;
    occurrence.closed_at = new Date();
    occurrence.closure_summary = summary;

    return this.occurrenceRepository.save(occurrence);
  }

  async addDocument(
    id: string,
    fileId: string,
    documentType: string,
    fileName: string,
  ): Promise<SeriousOccurrence> {
    const occurrence = await this.findById(id);
    occurrence.documents.push({
      fileId,
      documentType,
      fileName,
      uploadedAt: new Date(),
    });
    return this.occurrenceRepository.save(occurrence);
  }

  async listByResidence(
    residenceId: string,
    startDate?: Date,
    endDate?: Date,
    status?: OccurrenceStatus,
  ): Promise<SeriousOccurrence[]> {
    const qb = this.occurrenceRepository.createQueryBuilder('o');
    qb.where('o.residence_id = :residenceId', { residenceId });

    if (startDate && endDate) {
      qb.andWhere('o.occurrence_date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    return qb.orderBy('o.occurrence_date', 'DESC').getMany();
  }

  async listPendingMinistryReports(): Promise<SeriousOccurrence[]> {
    return this.occurrenceRepository.find({
      where: {
        ministry_reportable: true,
        status: In([OccurrenceStatus.REPORTED, OccurrenceStatus.UNDER_INVESTIGATION]),
      },
      order: { ministry_report_due: 'ASC' },
    });
  }

  async listByResident(residentId: string): Promise<SeriousOccurrence[]> {
    return this.occurrenceRepository.find({
      where: { resident_id: residentId },
      order: { occurrence_date: 'DESC' },
    });
  }

  async getStatistics(residenceId: string, months: number = 12): Promise<{
    totalOccurrences: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    ministryReportable: number;
    averageResolutionDays: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const occurrences = await this.occurrenceRepository.find({
      where: {
        residence_id: residenceId,
        occurrence_date: Between(startDate, endDate),
      },
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let ministryReportable = 0;
    let totalResolutionDays = 0;
    let closedCount = 0;

    for (const o of occurrences) {
      byType[o.occurrence_type] = (byType[o.occurrence_type] || 0) + 1;
      bySeverity[o.severity] = (bySeverity[o.severity] || 0) + 1;
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.ministry_reportable) ministryReportable++;
      if (o.closed_at) {
        const days = Math.ceil(
          (o.closed_at.getTime() - o.reported_at.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalResolutionDays += days;
        closedCount++;
      }
    }

    return {
      totalOccurrences: occurrences.length,
      byType,
      bySeverity,
      byStatus,
      ministryReportable,
      averageResolutionDays: closedCount > 0 ? Math.round(totalResolutionDays / closedCount) : 0,
    };
  }
}

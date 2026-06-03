import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Visit } from '../entities/visit.entity';
import { VisitLog } from '../entities/visit-log.entity';
import { VisitStatus, VisitType, CancellationReason } from '../interfaces/visit.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Visit Service
 * Core business logic for visit management
 */
@Injectable()
export class VisitService {
  private readonly logger = new Logger(VisitService.name);
  private readonly maxDurationHours: number;

  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(VisitLog)
    private readonly visitLogRepo: Repository<VisitLog>,
    private readonly configService: ConfigService,
  ) {
    this.maxDurationHours = this.configService.get<number>('visit.maxDurationHours', 24);
  }

  /**
   * Create a new visit
   */
  async create(data: Partial<Visit>): Promise<Visit> {
    // Validate duration
    if (data.scheduledStart && data.scheduledEnd) {
      const duration = (new Date(data.scheduledEnd).getTime() - new Date(data.scheduledStart).getTime()) / (1000 * 60 * 60);
      if (duration > this.maxDurationHours) {
        throw new BadRequestException(`Visit duration cannot exceed ${this.maxDurationHours} hours`);
      }
    }

    const visit = this.visitRepo.create({
      ...data,
      status: VisitStatus.SCHEDULED,
      tasks: data.tasks || [],
      notes: data.notes || [],
      attachments: data.attachments || [],
    });

    const saved = await this.visitRepo.save(visit);
    await this.logEvent(saved.id, 'VISIT_CREATED', undefined, saved.status, undefined, { visitType: saved.visitType });

    this.logger.log(`Visit ${saved.id} created for patient ${saved.patientId}`);
    return saved;
  }

  /**
   * Get visit by ID
   */
  async getById(id: string): Promise<Visit> {
    const visit = await this.visitRepo.findOne({ where: { id } });
    if (!visit) {
      throw new NotFoundException(`Visit ${id} not found`);
    }
    return visit;
  }

  /**
   * List visits with optional filters (parity helper)
   *
   * This supports legacy endpoints that Kong routes to `/visits` (e.g. `/tasks`,
   * `/shift-handoffs`) by ensuring `GET /visits` is available and returns a stable schema.
   */
  async list(params: {
    caregiverId?: string;
    patientId?: string;
    agencyId?: string;
    status?: VisitStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ items: Visit[]; total: number; page: number; limit: number; pages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const qb = this.visitRepo.createQueryBuilder('v');

    if (params.caregiverId) qb.andWhere('v.caregiverId = :caregiverId', { caregiverId: params.caregiverId });
    if (params.patientId) qb.andWhere('v.patientId = :patientId', { patientId: params.patientId });
    if (params.agencyId) qb.andWhere('v.agencyId = :agencyId', { agencyId: params.agencyId });
    if (params.status) qb.andWhere('v.status = :status', { status: params.status });

    if (params.startDate) qb.andWhere('v.scheduledStart >= :startDate', { startDate: params.startDate });
    if (params.endDate) qb.andWhere('v.scheduledEnd <= :endDate', { endDate: params.endDate });

    qb.orderBy('v.scheduledStart', 'DESC').skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Update visit status
   */
  async updateStatus(
    id: string,
    newStatus: VisitStatus,
    performedBy?: string,
    notes?: string,
  ): Promise<Visit> {
    const visit = await this.getById(id);
    const previousStatus = visit.status;

    // Validate status transition
    this.validateStatusTransition(previousStatus, newStatus);

    visit.status = newStatus;

    // Set timestamps based on status
    if (newStatus === VisitStatus.IN_PROGRESS && !visit.actualStart) {
      visit.actualStart = new Date();
    } else if (newStatus === VisitStatus.COMPLETED && !visit.actualEnd) {
      visit.actualEnd = new Date();
      if (visit.actualStart) {
        visit.durationMinutes = Math.round(
          (visit.actualEnd.getTime() - visit.actualStart.getTime()) / (1000 * 60),
        );
      }
    } else if (newStatus === VisitStatus.CONFIRMED) {
      visit.isConfirmed = true;
      visit.confirmedAt = new Date();
    }

    const saved = await this.visitRepo.save(visit);
    await this.logEvent(id, 'STATUS_CHANGED', previousStatus, newStatus, performedBy, { notes });

    return saved;
  }

  /**
   * Cancel a visit
   */
  async cancel(
    id: string,
    reason: CancellationReason,
    cancelledBy: string,
    notes?: string,
  ): Promise<Visit> {
    const visit = await this.getById(id);
    const previousStatus = visit.status;

    if (visit.status === VisitStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed visit');
    }

    visit.status = VisitStatus.CANCELLED;
    visit.cancellationReason = reason;
    visit.cancellationNotes = notes;
    visit.cancelledBy = cancelledBy;
    visit.cancelledAt = new Date();

    const saved = await this.visitRepo.save(visit);
    await this.logEvent(id, 'VISIT_CANCELLED', previousStatus, VisitStatus.CANCELLED, cancelledBy, {
      reason,
      notes,
    });

    return saved;
  }

  /**
   * Reschedule a visit
   */
  async reschedule(
    id: string,
    newStart: Date,
    newEnd: Date,
    rescheduledBy: string,
    reason?: string,
  ): Promise<Visit> {
    const originalVisit = await this.getById(id);

    if (originalVisit.status === VisitStatus.COMPLETED) {
      throw new BadRequestException('Cannot reschedule a completed visit');
    }

    // Create new visit
    const newVisit = await this.create({
      ...originalVisit,
      id: undefined,
      scheduledStart: newStart,
      scheduledEnd: newEnd,
      status: VisitStatus.SCHEDULED,
      rescheduledFromId: id,
      actualStart: undefined,
      actualEnd: undefined,
    });

    // Update original visit
    originalVisit.status = VisitStatus.RESCHEDULED;
    originalVisit.rescheduledToId = newVisit.id;
    await this.visitRepo.save(originalVisit);

    await this.logEvent(id, 'VISIT_RESCHEDULED', originalVisit.status, VisitStatus.RESCHEDULED, rescheduledBy, {
      newVisitId: newVisit.id,
      reason,
    });

    return newVisit;
  }

  /**
   * Complete a task within a visit
   */
  async completeTask(visitId: string, taskId: string, notes?: string): Promise<Visit> {
    const visit = await this.getById(visitId);

    const taskIndex = visit.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      throw new NotFoundException(`Task ${taskId} not found in visit`);
    }

    visit.tasks[taskIndex].completedAt = new Date().toISOString();
    if (notes) {
      visit.tasks[taskIndex].notes = notes;
    }

    const saved = await this.visitRepo.save(visit);
    await this.logEvent(visitId, 'TASK_COMPLETED', undefined, undefined, undefined, { taskId, notes });

    return saved;
  }

  /**
   * Add a note to a visit
   */
  async addNote(
    visitId: string,
    noteType: 'general' | 'clinical' | 'incident' | 'private',
    content: string,
    createdBy: string,
    isPrivate: boolean = false,
  ): Promise<Visit> {
    const visit = await this.getById(visitId);

    visit.notes.push({
      id: uuidv4(),
      type: noteType,
      content,
      createdBy,
      createdAt: new Date().toISOString(),
      isPrivate,
    });

    const saved = await this.visitRepo.save(visit);
    await this.logEvent(visitId, 'NOTE_ADDED', undefined, undefined, createdBy, { noteType });

    return saved;
  }

  /**
   * Get visits for a caregiver
   */
  async getCaregiverVisits(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
    status?: VisitStatus,
  ): Promise<Visit[]> {
    const where: Record<string, unknown> = {
      caregiverId,
      scheduledStart: MoreThanOrEqual(startDate),
      scheduledEnd: LessThanOrEqual(endDate),
    };
    if (status) {
      where.status = status;
    }

    return this.visitRepo.find({
      where,
      order: { scheduledStart: 'ASC' },
    });
  }

  /**
   * Get visits for a patient
   */
  async getPatientVisits(
    patientId: string,
    startDate: Date,
    endDate: Date,
    status?: VisitStatus,
  ): Promise<Visit[]> {
    const where: Record<string, unknown> = {
      patientId,
      scheduledStart: MoreThanOrEqual(startDate),
      scheduledEnd: LessThanOrEqual(endDate),
    };
    if (status) {
      where.status = status;
    }

    return this.visitRepo.find({
      where,
      order: { scheduledStart: 'ASC' },
    });
  }

  /**
   * Get visit history/logs
   */
  async getVisitLogs(visitId: string): Promise<VisitLog[]> {
    return this.visitLogRepo.find({
      where: { visitId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Rate a visit
   */
  async rateVisit(
    visitId: string,
    caregiverRating?: number,
    patientSatisfaction?: number,
    feedback?: string,
  ): Promise<Visit> {
    const visit = await this.getById(visitId);

    if (caregiverRating !== undefined) {
      visit.caregiverRating = Math.min(5, Math.max(1, caregiverRating));
    }
    if (patientSatisfaction !== undefined) {
      visit.patientSatisfaction = Math.min(5, Math.max(1, patientSatisfaction));
    }
    if (feedback) {
      visit.feedback = feedback;
    }

    const saved = await this.visitRepo.save(visit);
    await this.logEvent(visitId, 'VISIT_RATED', undefined, undefined, undefined, {
      caregiverRating,
      patientSatisfaction,
    });

    return saved;
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(from: VisitStatus, to: VisitStatus): void {
    const validTransitions: Record<VisitStatus, VisitStatus[]> = {
      [VisitStatus.SCHEDULED]: [VisitStatus.CONFIRMED, VisitStatus.CANCELLED, VisitStatus.RESCHEDULED],
      [VisitStatus.CONFIRMED]: [VisitStatus.EN_ROUTE, VisitStatus.CANCELLED, VisitStatus.RESCHEDULED, VisitStatus.NO_SHOW],
      [VisitStatus.EN_ROUTE]: [VisitStatus.IN_PROGRESS, VisitStatus.CANCELLED],
      [VisitStatus.IN_PROGRESS]: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
      [VisitStatus.COMPLETED]: [],
      [VisitStatus.CANCELLED]: [],
      [VisitStatus.NO_SHOW]: [],
      [VisitStatus.RESCHEDULED]: [],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(`Invalid status transition from ${from} to ${to}`);
    }
  }

  /**
   * Create visit log entry
   */
  private async logEvent(
    visitId: string,
    eventType: string,
    previousStatus?: VisitStatus | string,
    newStatus?: VisitStatus | string,
    performedBy?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const log = this.visitLogRepo.create({
      visitId,
      eventType,
      previousStatus,
      newStatus,
      performedBy,
      details,
    });
    await this.visitLogRepo.save(log);
  }
}

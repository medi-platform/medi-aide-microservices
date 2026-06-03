/**
 * Residential Shift Service
 * Business logic for managing residential shifts
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ResidentialShift } from '../entities/residential-shift.entity';
import { ShiftDefinition } from '../entities/shift-definition.entity';
import { ShiftHandoff } from '../entities/shift-handoff.entity';
import { ShiftStatus, ShiftType, HandoffStatus } from '../interfaces/residential.interface';

export interface CreateShiftDto {
  residence_id: string;
  shift_definition_id?: string;
  caregiver_id?: string;
  shift_date: Date;
  shift_type: ShiftType;
  scheduled_start: Date;
  scheduled_end: Date;
}

export interface UpdateShiftDto {
  caregiver_id?: string;
  status?: ShiftStatus;
  actual_start?: Date;
  actual_end?: Date;
  caregiver_notes?: string;
  supervisor_notes?: string;
}

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(ResidentialShift)
    private readonly shiftRepository: Repository<ResidentialShift>,
    @InjectRepository(ShiftDefinition)
    private readonly definitionRepository: Repository<ShiftDefinition>,
    @InjectRepository(ShiftHandoff)
    private readonly handoffRepository: Repository<ShiftHandoff>,
  ) {}

  async createShift(dto: CreateShiftDto): Promise<ResidentialShift> {
    const shift = this.shiftRepository.create({
      ...dto,
      status: ShiftStatus.SCHEDULED,
    });
    return this.shiftRepository.save(shift);
  }

  async findById(id: string): Promise<ResidentialShift> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['residence', 'shift_definition', 'tasks'],
    });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async updateShift(id: string, dto: UpdateShiftDto): Promise<ResidentialShift> {
    const shift = await this.findById(id);
    Object.assign(shift, dto);
    return this.shiftRepository.save(shift);
  }

  async clockIn(id: string, evvId?: string): Promise<ResidentialShift> {
    const shift = await this.findById(id);
    
    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException('Can only clock in to scheduled shifts');
    }

    shift.status = ShiftStatus.IN_PROGRESS;
    shift.clock_in_time = new Date();
    shift.actual_start = new Date();
    if (evvId) {
      shift.clock_in_evv_id = evvId;
    }

    return this.shiftRepository.save(shift);
  }

  async clockOut(id: string, evvId?: string): Promise<ResidentialShift> {
    const shift = await this.findById(id);
    
    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only clock out from in-progress shifts');
    }

    shift.status = ShiftStatus.COMPLETED;
    shift.clock_out_time = new Date();
    shift.actual_end = new Date();
    if (evvId) {
      shift.clock_out_evv_id = evvId;
    }

    // Calculate overtime
    const scheduledDuration = (shift.scheduled_end.getTime() - shift.scheduled_start.getTime()) / 3600000;
    const actualDuration = (shift.actual_end.getTime() - shift.actual_start!.getTime()) / 3600000;
    
    if (actualDuration > scheduledDuration) {
      shift.is_overtime = true;
      shift.overtime_hours = actualDuration - scheduledDuration;
    }

    return this.shiftRepository.save(shift);
  }

  async recordBreak(id: string, startTime: Date, endTime: Date): Promise<ResidentialShift> {
    const shift = await this.findById(id);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    
    shift.breaks.push({
      startTime,
      endTime,
      durationMinutes,
    });
    shift.break_minutes_taken += durationMinutes;

    return this.shiftRepository.save(shift);
  }

  async cancelShift(id: string, reason: string): Promise<ResidentialShift> {
    const shift = await this.findById(id);
    
    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException('Can only cancel scheduled shifts');
    }

    shift.status = ShiftStatus.CANCELLED;
    shift.supervisor_notes = reason;

    return this.shiftRepository.save(shift);
  }

  async assignCaregiver(id: string, caregiverId: string): Promise<ResidentialShift> {
    const shift = await this.findById(id);
    
    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException('Can only assign caregivers to scheduled shifts');
    }

    if (shift.caregiver_id) {
      shift.original_caregiver_id = shift.caregiver_id;
      shift.is_coverage = true;
    }

    shift.caregiver_id = caregiverId;
    return this.shiftRepository.save(shift);
  }

  async listByResidence(
    residenceId: string,
    startDate: Date,
    endDate: Date,
    status?: ShiftStatus,
  ): Promise<ResidentialShift[]> {
    const qb = this.shiftRepository.createQueryBuilder('s');
    qb.where('s.residence_id = :residenceId', { residenceId });
    qb.andWhere('s.shift_date BETWEEN :startDate AND :endDate', { startDate, endDate });
    
    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    return qb.orderBy('s.scheduled_start', 'ASC').getMany();
  }

  async listByCaregiver(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ResidentialShift[]> {
    return this.shiftRepository.find({
      where: {
        caregiver_id: caregiverId,
        shift_date: Between(startDate, endDate),
      },
      relations: ['residence'],
      order: { scheduled_start: 'ASC' },
    });
  }

  async getUnfilledShifts(residenceId: string, daysAhead: number = 7): Promise<ResidentialShift[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    return this.shiftRepository.find({
      where: {
        residence_id: residenceId,
        caregiver_id: undefined,
        status: ShiftStatus.SCHEDULED,
        shift_date: Between(startDate, endDate),
      },
      order: { scheduled_start: 'ASC' },
    });
  }

  // Shift Definition Methods
  async createShiftDefinition(dto: Partial<ShiftDefinition>): Promise<ShiftDefinition> {
    const definition = this.definitionRepository.create(dto);
    return this.definitionRepository.save(definition);
  }

  async listShiftDefinitions(residenceId: string): Promise<ShiftDefinition[]> {
    return this.definitionRepository.find({
      where: { residence_id: residenceId, is_active: true },
      order: { start_time: 'ASC' },
    });
  }

  // Handoff Methods
  async createHandoff(
    outgoingShiftId: string,
    incomingShiftId: string,
    notes?: string,
  ): Promise<ShiftHandoff> {
    const outgoing = await this.findById(outgoingShiftId);
    const incoming = await this.findById(incomingShiftId);

    const handoff = this.handoffRepository.create({
      outgoing_shift_id: outgoingShiftId,
      incoming_shift_id: incomingShiftId,
      outgoing_caregiver_id: outgoing.caregiver_id!,
      incoming_caregiver_id: incoming.caregiver_id!,
      status: HandoffStatus.PENDING,
      general_notes: notes,
    });

    return this.handoffRepository.save(handoff);
  }

  async completeHandoff(
    handoffId: string,
    residentUpdates: any[],
    pendingTasks: any[],
    followUpItems: any[],
  ): Promise<ShiftHandoff> {
    const handoff = await this.handoffRepository.findOne({ where: { id: handoffId } });
    if (!handoff) {
      throw new NotFoundException(`Handoff with ID ${handoffId} not found`);
    }

    handoff.status = HandoffStatus.COMPLETED;
    handoff.handoff_time = new Date();
    handoff.resident_updates = residentUpdates;
    handoff.pending_tasks = pendingTasks;
    handoff.follow_up_items = followUpItems;
    handoff.outgoing_acknowledged = true;
    handoff.outgoing_acknowledged_at = new Date();

    return this.handoffRepository.save(handoff);
  }

  async acknowledgeHandoff(handoffId: string, isIncoming: boolean): Promise<ShiftHandoff> {
    const handoff = await this.handoffRepository.findOne({ where: { id: handoffId } });
    if (!handoff) {
      throw new NotFoundException(`Handoff with ID ${handoffId} not found`);
    }

    if (isIncoming) {
      handoff.incoming_acknowledged = true;
      handoff.incoming_acknowledged_at = new Date();
    } else {
      handoff.outgoing_acknowledged = true;
      handoff.outgoing_acknowledged_at = new Date();
    }

    return this.handoffRepository.save(handoff);
  }
}

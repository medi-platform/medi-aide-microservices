import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { CaregiverSchedule } from '../entities/caregiver-schedule.entity';
import { CaregiverBlockedSlot } from '../entities/caregiver-blocked-slot.entity';
import { CaregiverVacation, VacationRequestStatus } from '../entities/caregiver-vacation.entity';

@Injectable()
export class CaregiverScheduleService {
  constructor(
    @InjectRepository(CaregiverSchedule)
    private readonly scheduleRepository: Repository<CaregiverSchedule>,
    @InjectRepository(CaregiverBlockedSlot)
    private readonly blockedSlotRepository: Repository<CaregiverBlockedSlot>,
    @InjectRepository(CaregiverVacation)
    private readonly vacationRepository: Repository<CaregiverVacation>,
  ) {}

  // ===== SCHEDULE TEMPLATES =====

  async createSchedule(data: Partial<CaregiverSchedule>): Promise<CaregiverSchedule> {
    // Deactivate any overlapping schedules
    if (data.isActive) {
      await this.scheduleRepository.update(
        {
          caregiverId: data.caregiverId,
          isActive: true,
        },
        { isActive: false },
      );
    }
    const schedule = this.scheduleRepository.create(data);
    return this.scheduleRepository.save(schedule);
  }

  async getSchedule(id: string): Promise<CaregiverSchedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    return schedule;
  }

  async getActiveSchedule(caregiverId: string): Promise<CaregiverSchedule | null> {
    return this.scheduleRepository.findOne({
      where: { caregiverId, isActive: true },
    });
  }

  async updateSchedule(id: string, data: Partial<CaregiverSchedule>): Promise<CaregiverSchedule> {
    const schedule = await this.getSchedule(id);
    Object.assign(schedule, data);
    return this.scheduleRepository.save(schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    const result = await this.scheduleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
  }

  async listCaregiverSchedules(caregiverId: string): Promise<CaregiverSchedule[]> {
    return this.scheduleRepository.find({
      where: { caregiverId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  // ===== BLOCKED SLOTS =====

  async createBlockedSlot(data: Partial<CaregiverBlockedSlot>): Promise<CaregiverBlockedSlot> {
    const slot = this.blockedSlotRepository.create(data);
    return this.blockedSlotRepository.save(slot);
  }

  async getBlockedSlot(id: string): Promise<CaregiverBlockedSlot> {
    const slot = await this.blockedSlotRepository.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException(`Blocked slot ${id} not found`);
    }
    return slot;
  }

  async updateBlockedSlot(id: string, data: Partial<CaregiverBlockedSlot>): Promise<CaregiverBlockedSlot> {
    const slot = await this.getBlockedSlot(id);
    Object.assign(slot, data);
    return this.blockedSlotRepository.save(slot);
  }

  async deleteBlockedSlot(id: string): Promise<void> {
    const result = await this.blockedSlotRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Blocked slot ${id} not found`);
    }
  }

  async listBlockedSlots(
    caregiverId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CaregiverBlockedSlot[]> {
    const qb = this.blockedSlotRepository.createQueryBuilder('slot')
      .where('slot.caregiverId = :caregiverId', { caregiverId });
    
    if (startDate && endDate) {
      qb.andWhere('slot.startDate <= :endDate AND slot.endDate >= :startDate', {
        startDate,
        endDate,
      });
    }
    
    return qb.orderBy('slot.startDate', 'ASC').getMany();
  }

  // ===== VACATION REQUESTS =====

  async createVacationRequest(data: Partial<CaregiverVacation>): Promise<CaregiverVacation> {
    // Calculate total days
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      data.totalDays = data.isHalfDay ? 0.5 : diffDays;
    }
    
    const vacation = this.vacationRepository.create(data);
    return this.vacationRepository.save(vacation);
  }

  async getVacationRequest(id: string): Promise<CaregiverVacation> {
    const vacation = await this.vacationRepository.findOne({ where: { id } });
    if (!vacation) {
      throw new NotFoundException(`Vacation request ${id} not found`);
    }
    return vacation;
  }

  async approveVacation(id: string, approvedBy: string): Promise<CaregiverVacation> {
    const vacation = await this.getVacationRequest(id);
    vacation.status = VacationRequestStatus.APPROVED;
    vacation.approvedBy = approvedBy;
    vacation.approvedAt = new Date();
    return this.vacationRepository.save(vacation);
  }

  async rejectVacation(id: string, reason: string): Promise<CaregiverVacation> {
    const vacation = await this.getVacationRequest(id);
    vacation.status = VacationRequestStatus.REJECTED;
    vacation.rejectionReason = reason;
    return this.vacationRepository.save(vacation);
  }

  async cancelVacation(id: string): Promise<CaregiverVacation> {
    const vacation = await this.getVacationRequest(id);
    if (vacation.status === VacationRequestStatus.APPROVED) {
      throw new BadRequestException('Cannot cancel an approved vacation without manager approval');
    }
    vacation.status = VacationRequestStatus.CANCELLED;
    return this.vacationRepository.save(vacation);
  }

  async listCaregiverVacations(
    caregiverId: string,
    status?: VacationRequestStatus,
  ): Promise<CaregiverVacation[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.vacationRepository.find({
      where,
      order: { startDate: 'DESC' },
    });
  }

  async listPendingVacationRequests(agencyId?: string): Promise<CaregiverVacation[]> {
    const where: any = { status: VacationRequestStatus.PENDING };
    if (agencyId) {
      where.agencyId = agencyId;
    }
    return this.vacationRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }
}

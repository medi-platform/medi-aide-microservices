import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AgencyShift } from '../entities/agency-shift.entity';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(AgencyShift)
    private shiftRepo: Repository<AgencyShift>,
  ) {}

  async getShifts(agencyId: string, query: any) {
    const { startDate, endDate, caregiverId, status, page = 1, limit = 50 } = query;
    const where: any = { agency_id: agencyId };
    if (caregiverId) where.caregiver_id = caregiverId;
    if (status) where.status = status;

    const [items, total] = await this.shiftRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { start_time: 'ASC' },
    });

    return { items, total, page, limit };
  }

  async createShift(agencyId: string, dto: any) {
    const shift = this.shiftRepo.create({ ...dto, agency_id: agencyId });
    return this.shiftRepo.save(shift);
  }

  async getShift(agencyId: string, shiftId: string) {
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId, agency_id: agencyId },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async updateShift(agencyId: string, shiftId: string, dto: any) {
    await this.getShift(agencyId, shiftId);
    await this.shiftRepo.update(shiftId, dto);
    return this.getShift(agencyId, shiftId);
  }

  async deleteShift(agencyId: string, shiftId: string) {
    await this.shiftRepo.delete(shiftId);
    return { deleted: true };
  }

  async assignShift(agencyId: string, shiftId: string, caregiverId: string) {
    await this.shiftRepo.update(shiftId, { 
      caregiver_id: caregiverId, 
      status: 'assigned' 
    });
    return this.getShift(agencyId, shiftId);
  }

  async unassignShift(agencyId: string, shiftId: string) {
    await this.shiftRepo.update(shiftId, { 
      caregiver_id: null, 
      status: 'open' 
    });
    return this.getShift(agencyId, shiftId);
  }

  async getOpenShifts(agencyId: string, query: any) {
    return this.shiftRepo.find({
      where: { agency_id: agencyId, status: 'open' },
    });
  }

  async requestSwap(agencyId: string, shiftId: string, dto: any) {
    return { shiftId, ...dto, status: 'pending' };
  }

  async getSwapRequests(agencyId: string, status?: string) {
    return [];
  }

  async approveSwap(agencyId: string, requestId: string) {
    return { requestId, status: 'approved' };
  }

  async rejectSwap(agencyId: string, requestId: string, reason: string) {
    return { requestId, status: 'rejected', reason };
  }

  async getCoverage(agencyId: string, date: string) {
    return {
      date,
      totalShifts: 20,
      filledShifts: 18,
      openShifts: 2,
      coverageRate: 90,
    };
  }

  async getOvertime(agencyId: string, startDate: string, endDate: string) {
    return {
      period: { startDate, endDate },
      totalOvertimeHours: 45,
      caregivers: [],
    };
  }
}


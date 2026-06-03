import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  CaregiverShift,
  ShiftAssignmentStatus,
  CaregiverShiftType,
} from '../entities/caregiver-shift.entity';
import { CaregiverShiftBid, ShiftBidStatus } from '../entities/caregiver-shift-bid.entity';
import { CaregiverClockRecord, ClockRecordType } from '../entities/caregiver-clock-record.entity';

@Injectable()
export class CaregiverShiftService {
  constructor(
    @InjectRepository(CaregiverShift)
    private readonly shiftRepository: Repository<CaregiverShift>,
    @InjectRepository(CaregiverShiftBid)
    private readonly shiftBidRepository: Repository<CaregiverShiftBid>,
    @InjectRepository(CaregiverClockRecord)
    private readonly clockRecordRepository: Repository<CaregiverClockRecord>,
  ) {}

  // ===== SHIFT MANAGEMENT =====

  async createShift(data: Partial<CaregiverShift>): Promise<CaregiverShift> {
    const shift = this.shiftRepository.create(data);
    return this.shiftRepository.save(shift);
  }

  async getShift(id: string): Promise<CaregiverShift> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift ${id} not found`);
    }
    return shift;
  }

  async updateShift(id: string, data: Partial<CaregiverShift>): Promise<CaregiverShift> {
    const shift = await this.getShift(id);
    Object.assign(shift, data);
    return this.shiftRepository.save(shift);
  }

  async cancelShift(
    id: string,
    cancelledBy: string,
    reason: string,
  ): Promise<CaregiverShift> {
    const shift = await this.getShift(id);
    shift.status = ShiftAssignmentStatus.CANCELLED;
    shift.cancelledBy = cancelledBy;
    shift.cancellationReason = reason;
    shift.cancelledAt = new Date();
    return this.shiftRepository.save(shift);
  }

  async listCaregiverShifts(
    caregiverId: string,
    startDate?: Date,
    endDate?: Date,
    status?: ShiftAssignmentStatus,
  ): Promise<CaregiverShift[]> {
    const where: any = { caregiverId };
    if (startDate && endDate) {
      where.shiftDate = Between(startDate, endDate);
    }
    if (status) {
      where.status = status;
    }
    return this.shiftRepository.find({
      where,
      order: { shiftDate: 'ASC', scheduledStart: 'ASC' },
    });
  }

  async startShift(id: string): Promise<CaregiverShift> {
    const shift = await this.getShift(id);
    if (shift.status !== ShiftAssignmentStatus.CONFIRMED) {
      throw new BadRequestException('Shift must be confirmed before starting');
    }
    shift.status = ShiftAssignmentStatus.IN_PROGRESS;
    shift.actualStart = new Date();
    return this.shiftRepository.save(shift);
  }

  async endShift(id: string): Promise<CaregiverShift> {
    const shift = await this.getShift(id);
    if (shift.status !== ShiftAssignmentStatus.IN_PROGRESS) {
      throw new BadRequestException('Shift must be in progress to end');
    }
    shift.status = ShiftAssignmentStatus.COMPLETED;
    shift.actualEnd = new Date();

    // Calculate total hours
    if (shift.actualStart && shift.actualEnd) {
      const diffMs = shift.actualEnd.getTime() - shift.actualStart.getTime();
      shift.totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    return this.shiftRepository.save(shift);
  }

  // ===== SHIFT BIDDING =====

  async createShiftBid(data: Partial<CaregiverShiftBid>): Promise<CaregiverShiftBid> {
    // Check if caregiver already has a pending bid
    const existingBid = await this.shiftBidRepository.findOne({
      where: {
        caregiverId: data.caregiverId,
        openShiftId: data.openShiftId,
        status: ShiftBidStatus.PENDING,
      },
    });
    if (existingBid) {
      throw new BadRequestException('Caregiver already has a pending bid for this shift');
    }

    const bid = this.shiftBidRepository.create(data);
    return this.shiftBidRepository.save(bid);
  }

  async getShiftBid(id: string): Promise<CaregiverShiftBid> {
    const bid = await this.shiftBidRepository.findOne({ where: { id } });
    if (!bid) {
      throw new NotFoundException(`Shift bid ${id} not found`);
    }
    return bid;
  }

  async acceptShiftBid(id: string, reviewedBy: string): Promise<CaregiverShiftBid> {
    const bid = await this.getShiftBid(id);
    bid.status = ShiftBidStatus.ACCEPTED;
    bid.reviewedBy = reviewedBy;
    bid.reviewedAt = new Date();
    return this.shiftBidRepository.save(bid);
  }

  async rejectShiftBid(
    id: string,
    reviewedBy: string,
    reason: string,
  ): Promise<CaregiverShiftBid> {
    const bid = await this.getShiftBid(id);
    bid.status = ShiftBidStatus.REJECTED;
    bid.reviewedBy = reviewedBy;
    bid.reviewedAt = new Date();
    bid.rejectionReason = reason;
    return this.shiftBidRepository.save(bid);
  }

  async withdrawShiftBid(id: string): Promise<CaregiverShiftBid> {
    const bid = await this.getShiftBid(id);
    bid.status = ShiftBidStatus.WITHDRAWN;
    return this.shiftBidRepository.save(bid);
  }

  async listBidsForShift(openShiftId: string): Promise<CaregiverShiftBid[]> {
    return this.shiftBidRepository.find({
      where: { openShiftId },
      order: { priorityScore: 'DESC', createdAt: 'ASC' },
    });
  }

  async listCaregiverBids(
    caregiverId: string,
    status?: ShiftBidStatus,
  ): Promise<CaregiverShiftBid[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.shiftBidRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // ===== CLOCK RECORDS =====

  async clockIn(caregiverId: string, shiftId: string): Promise<CaregiverClockRecord> {
    const record = this.clockRecordRepository.create({
      caregiver_id: caregiverId,
      shift_id: shiftId,
      record_type: ClockRecordType.CLOCK_IN,
      record_time: new Date(),
    });
    return this.clockRecordRepository.save(record);
  }

  async clockOut(id: string): Promise<CaregiverClockRecord> {
    const record = await this.clockRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Clock record ${id} not found`);
    }
    const clockOutRecord = this.clockRecordRepository.create({
      caregiver_id: record.caregiver_id,
      shift_id: record.shift_id,
      visit_id: record.visit_id,
      patient_id: record.patient_id,
      record_type: ClockRecordType.CLOCK_OUT,
      record_time: new Date(),
      source: record.source,
    });
    return this.clockRecordRepository.save(clockOutRecord);
  }

  async getClockRecordsForShift(shiftId: string): Promise<CaregiverClockRecord[]> {
    return this.clockRecordRepository.find({
      where: { shift_id: shiftId },
      order: { record_time: 'ASC' },
    });
  }
}

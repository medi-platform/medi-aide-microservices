import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CaregiverAvailability } from '../entities/caregiver-availability.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(CaregiverAvailability)
    private availabilityRepo: Repository<CaregiverAvailability>,
  ) {}

  async getAvailability(caregiverId: string, startDate?: string, endDate?: string) {
    const where: any = { caregiver_id: caregiverId };
    return this.availabilityRepo.find({ where, order: { date: 'ASC' } });
  }

  async setAvailability(caregiverId: string, dto: any) {
    const availability = this.availabilityRepo.create({ 
      ...dto, 
      caregiver_id: caregiverId 
    });
    return this.availabilityRepo.save(availability);
  }

  async updateAvailability(caregiverId: string, dto: any) {
    const { id, ...updateData } = dto;
    await this.availabilityRepo.update(id, updateData);
    return this.availabilityRepo.findOne({ where: { id } });
  }

  async getWeeklyPattern(caregiverId: string) {
    return {
      caregiverId,
      pattern: {
        monday: { available: true, start: '08:00', end: '18:00' },
        tuesday: { available: true, start: '08:00', end: '18:00' },
        wednesday: { available: true, start: '08:00', end: '18:00' },
        thursday: { available: true, start: '08:00', end: '18:00' },
        friday: { available: true, start: '08:00', end: '18:00' },
        saturday: { available: false },
        sunday: { available: false },
      },
    };
  }

  async setWeeklyPattern(caregiverId: string, dto: any) {
    return { caregiverId, pattern: dto, updated: true };
  }

  async requestTimeOff(caregiverId: string, dto: { startDate: string; endDate: string; reason: string }) {
    return { caregiverId, ...dto, status: 'pending', id: 'new-request-id' };
  }

  async getTimeOffRequests(caregiverId: string) {
    return [];
  }

  async cancelTimeOff(caregiverId: string, requestId: string) {
    return { requestId, status: 'cancelled' };
  }

  async checkConflicts(caregiverId: string, date: string, startTime: string, endTime: string) {
    return {
      hasConflicts: false,
      conflicts: [],
    };
  }
}



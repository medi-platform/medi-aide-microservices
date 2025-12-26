import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';

@Injectable()
export class ScheduleService {
  constructor(@InjectRepository(Schedule) private repo: Repository<Schedule>) {}

  async findAll(query: any) { const [items, total] = await this.repo.findAndCount(); return { items, total }; }
  async getCaregiverSchedule(caregiverId: string, start: string, end: string) { return this.repo.find({ where: { caregiver_id: caregiverId } }); }
  async getPatientSchedule(patientId: string, start: string, end: string) { return this.repo.find({ where: { patient_id: patientId } }); }
  async create(dto: any) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
  async checkConflicts(query: any) { return { hasConflicts: false, conflicts: [] }; }
}



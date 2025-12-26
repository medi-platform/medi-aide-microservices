import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentService {
  constructor(@InjectRepository(Appointment) private repo: Repository<Appointment>) {}

  async findAll(query: any) { const [items, total] = await this.repo.findAndCount({ order: { start_time: 'ASC' } }); return { items, total }; }
  async create(dto: any) { return this.repo.save(this.repo.create({ ...dto, status: 'scheduled' })); }
  async findById(id: string) { const a = await this.repo.findOne({ where: { id } }); if (!a) throw new NotFoundException(); return a; }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async confirm(id: string) { await this.repo.update(id, { status: 'confirmed' }); return this.findById(id); }
  async cancel(id: string, reason: string) { await this.repo.update(id, { status: 'cancelled', cancellation_reason: reason }); return this.findById(id); }
  async reschedule(id: string, dto: any) { await this.repo.update(id, { ...dto, status: 'rescheduled' }); return this.findById(id); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}


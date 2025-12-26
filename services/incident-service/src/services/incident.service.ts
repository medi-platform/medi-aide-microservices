import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { IncidentFollowUp } from '../entities/incident-follow-up.entity';

@Injectable()
export class IncidentService {
  constructor(
    @InjectRepository(Incident) private repo: Repository<Incident>,
    @InjectRepository(IncidentFollowUp) private followUpRepo: Repository<IncidentFollowUp>
  ) {}

  async create(dto: any) { return this.repo.save(this.repo.create({ ...dto, status: 'reported' })); }
  async findAll(query: any) { const [items, total] = await this.repo.findAndCount({ order: { created_at: 'DESC' } }); return { items, total }; }
  async findById(id: string) { const i = await this.repo.findOne({ where: { id } }); if (!i) throw new NotFoundException(); return i; }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async updateStatus(id: string, status: string) { await this.repo.update(id, { status }); return this.findById(id); }
  async assign(id: string, userId: string) { await this.repo.update(id, { assigned_to: userId, status: 'investigating' }); return this.findById(id); }
  async addFollowUp(id: string, dto: any) { return this.followUpRepo.save(this.followUpRepo.create({ ...dto, incident_id: id })); }
  async getFollowUps(id: string) { return this.followUpRepo.find({ where: { incident_id: id }, order: { created_at: 'DESC' } }); }
  async close(id: string, dto: any) { await this.repo.update(id, { ...dto, status: 'closed', closed_at: new Date() }); return this.findById(id); }
}


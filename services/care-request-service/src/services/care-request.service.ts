import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareRequest } from '../entities/care-request.entity';
import { CareRequestHistory } from '../entities/care-request-history.entity';

@Injectable()
export class CareRequestService {
  constructor(
    @InjectRepository(CareRequest) private repo: Repository<CareRequest>,
    @InjectRepository(CareRequestHistory) private historyRepo: Repository<CareRequestHistory>
  ) {}

  async create(dto: any) { return this.repo.save(this.repo.create({ ...dto, status: 'pending' })); }
  async findAll(query: any) { const [items, total] = await this.repo.findAndCount({ order: { created_at: 'DESC' } }); return { items, total }; }
  async findById(id: string) { const r = await this.repo.findOne({ where: { id } }); if (!r) throw new NotFoundException(); return r; }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async updateStatus(id: string, status: string) { await this.repo.update(id, { status }); return this.findById(id); }
  async assignCaregiver(id: string, caregiverId: string) { await this.repo.update(id, { caregiver_id: caregiverId, status: 'assigned' }); return this.findById(id); }
  async cancel(id: string) { await this.repo.update(id, { status: 'cancelled' }); return { status: 'cancelled' }; }
  async getHistory(id: string) { return this.historyRepo.find({ where: { care_request_id: id } }); }
}


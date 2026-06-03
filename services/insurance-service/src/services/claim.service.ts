import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceClaim } from '../entities/insurance-claim.entity';

@Injectable()
export class ClaimService {
  constructor(@InjectRepository(InsuranceClaim) private repo: Repository<InsuranceClaim>) {}

  async findAll(query: any) { const [items, total] = await this.repo.findAndCount({ order: { created_at: 'DESC' } }); return { items, total }; }
  async submit(dto: any) { return this.repo.save(this.repo.create({ ...dto, status: 'submitted' })); }
  async findById(id: string) { const c = await this.repo.findOne({ where: { id } }); if (!c) throw new NotFoundException(); return c; }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async updateStatus(id: string, status: string) { await this.repo.update(id, { status }); return this.findById(id); }
  async resubmit(id: string) { await this.repo.update(id, { status: 'resubmitted' }); return this.findById(id); }
  async checkStatus(id: string) { const c = await this.findById(id); return { id, status: c.status }; }
  async getBatches(query: any) { return { batches: [] }; }
  async submitBatch(dto: any) { return { batchId: 'batch-123', claimCount: dto.claims?.length || 0, status: 'submitted' }; }
}



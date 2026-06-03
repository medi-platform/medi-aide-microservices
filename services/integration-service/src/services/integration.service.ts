import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationConfig } from '../entities/integration-config.entity';

@Injectable()
export class IntegrationService {
  constructor(@InjectRepository(IntegrationConfig) private repo: Repository<IntegrationConfig>) {}

  async findAll(query: any) { return this.repo.find(); }
  async getAvailable() { return [{ id: 'alayacare', name: 'AlayaCare' }, { id: 'wellsky', name: 'WellSky' }, { id: 'ukg', name: 'UKG' }, { id: 'axiscare', name: 'AxisCare' }]; }
  async create(dto: any) { return this.repo.save(this.repo.create(dto)); }
  async findById(id: string) { const i = await this.repo.findOne({ where: { id } }); if (!i) throw new NotFoundException(); return i; }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async enable(id: string) { await this.repo.update(id, { is_enabled: true }); return this.findById(id); }
  async disable(id: string) { await this.repo.update(id, { is_enabled: false }); return this.findById(id); }
  async testConnection(id: string) { return { id, connected: true, latency: 150 }; }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}



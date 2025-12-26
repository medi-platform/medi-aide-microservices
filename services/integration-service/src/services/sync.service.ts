import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncJob } from '../entities/sync-job.entity';

@Injectable()
export class SyncService {
  constructor(@InjectRepository(SyncJob) private repo: Repository<SyncJob>) {}

  async startSync(integrationId: string, dto: any) { return this.repo.save(this.repo.create({ integration_id: integrationId, status: 'running', ...dto })); }
  async getStatus(integrationId: string) { const job = await this.repo.findOne({ where: { integration_id: integrationId }, order: { created_at: 'DESC' } }); return job || { status: 'no_sync' }; }
  async getHistory(integrationId: string) { return this.repo.find({ where: { integration_id: integrationId }, order: { created_at: 'DESC' }, take: 20 }); }
  async importData(integrationId: string, dto: any) { return { integrationId, imported: true, ...dto }; }
  async exportData(integrationId: string, dto: any) { return { integrationId, exported: true, ...dto }; }
}


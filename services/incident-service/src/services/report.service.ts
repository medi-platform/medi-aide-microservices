import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentReport } from '../entities/incident-report.entity';

@Injectable()
export class ReportService {
  constructor(@InjectRepository(IncidentReport) private repo: Repository<IncidentReport>) {}

  async getSummary(period: string) { return { period, total: 25, resolved: 20, pending: 5 }; }
  async getByType(startDate: string, endDate: string) { return { period: { startDate, endDate }, breakdown: [] }; }
  async getBySeverity(query: any) { return { breakdown: { low: 10, medium: 10, high: 4, critical: 1 } }; }
  async getTrends(period: string) { return { period, trends: [] }; }
  async generate(dto: any) { return this.repo.save(this.repo.create({ ...dto, status: 'generating' })); }
}



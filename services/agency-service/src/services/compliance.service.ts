import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyComplianceRecord } from '../entities/agency-compliance-record.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(AgencyComplianceRecord)
    private complianceRepo: Repository<AgencyComplianceRecord>,
  ) {}

  async getOverview(agencyId: string) {
    return {
      overallScore: 92,
      status: 'compliant',
      categories: {
        documentation: 95,
        training: 88,
        licensing: 100,
        insurance: 100,
      },
      pendingItems: 3,
      upcomingDeadlines: 2,
    };
  }

  async getRecords(agencyId: string, query: any) {
    const { category, status, page = 1, limit = 20 } = query;
    const where: any = { agency_id: agencyId };
    if (category) where.category = category;
    if (status) where.status = status;

    const [items, total] = await this.complianceRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async createRecord(agencyId: string, dto: any) {
    const record = this.complianceRepo.create({ ...dto, agency_id: agencyId });
    return this.complianceRepo.save(record);
  }

  async getRecord(agencyId: string, recordId: string) {
    const record = await this.complianceRepo.findOne({
      where: { id: recordId, agency_id: agencyId },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async updateRecord(agencyId: string, recordId: string, dto: any) {
    await this.getRecord(agencyId, recordId);
    await this.complianceRepo.update(recordId, dto);
    return this.getRecord(agencyId, recordId);
  }

  async getCertifications(agencyId: string) {
    return [];
  }

  async getExpiringCertifications(agencyId: string, days: number) {
    return [];
  }

  async getDocuments(agencyId: string) {
    return [];
  }

  async uploadDocument(agencyId: string, dto: any) {
    return { ...dto, uploaded: true };
  }

  async getAudits(agencyId: string) {
    return [];
  }

  async getAuditReadiness(agencyId: string) {
    return {
      score: 88,
      status: 'ready',
      gaps: [],
      recommendations: [],
    };
  }
}


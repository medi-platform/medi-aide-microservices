import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { ComplianceRecord } from '../entities/compliance-record.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) 
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(ComplianceRecord) 
    private readonly complianceRepo: Repository<ComplianceRecord>
  ) {}

  async createAuditLog(data: any) {
    const log = this.auditRepo.create({
      ...data,
      timestamp: data.timestamp || new Date()
    });
    return this.auditRepo.save(log);
  }

  async getAuditLogs(filters: any) {
    const query = this.auditRepo.createQueryBuilder('log');

    if (filters.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('log.timestamp BETWEEN :start AND :end', {
        start: new Date(filters.startDate),
        end: new Date(filters.endDate)
      });
    }

    return query
      .orderBy('log.timestamp', 'DESC')
      .take(100)
      .getMany();
  }

  async getComplianceStatus() {
    const records = await this.complianceRepo.find({
      order: { regulationType: 'ASC', requirementId: 'ASC' }
    });

    const summary = records.reduce((acc: any, record) => {
      if (!acc[record.regulationType]) {
        acc[record.regulationType] = {
          compliant: 0,
          non_compliant: 0,
          pending_review: 0
        };
      }
      acc[record.regulationType][record.status]++;
      return acc;
    }, {});

    return { records, summary };
  }

  async updateComplianceRecord(data: any) {
    const existing = await this.complianceRepo.findOne({
      where: { requirementId: data.requirementId }
    });

    if (existing) {
      Object.assign(existing, data);
      existing.lastReviewDate = new Date();
      return this.complianceRepo.save(existing);
    }

    const record = this.complianceRepo.create({
      ...data,
      lastReviewDate: new Date()
    });
    return this.complianceRepo.save(record);
  }

  async generateHIPAAReport() {
    const hipaaRecords = await this.complianceRepo.find({
      where: { regulationType: 'HIPAA' }
    });

    const accessLogs = await this.auditRepo.count({
      where: {
        action: 'data.access',
        timestamp: Between(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        )
      }
    });

    const breaches = await this.auditRepo.count({
      where: {
        action: 'security.breach',
        timestamp: Between(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          new Date()
        )
      }
    });

    return {
      generatedAt: new Date(),
      complianceRecords: hipaaRecords,
      metrics: {
        totalAccessLogs30Days: accessLogs,
        securityBreaches365Days: breaches,
        complianceScore: this.calculateComplianceScore(hipaaRecords)
      }
    };
  }

  private calculateComplianceScore(records: ComplianceRecord[]): number {
    if (records.length === 0) return 0;
    const compliant = records.filter(r => r.status === 'compliant').length;
    return Math.round((compliant / records.length) * 100);
  }
}

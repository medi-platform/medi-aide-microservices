import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, MoreThan } from 'typeorm';
import { AgencyComplianceRecord } from '../entities/agency-compliance-record.entity';
import { AgencyProfile } from '../entities/agency-profile.entity';
import { ProvincialRulesService } from './provincial-rules.service';
import { 
  ComplianceStatus, 
  ComplianceItem, 
  ComplianceSummary,
  ComplianceAlert,
  ComplianceStatistics,
} from '../interfaces/labor-law.interface';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(AgencyComplianceRecord)
    private complianceRepo: Repository<AgencyComplianceRecord>,
    @InjectRepository(AgencyProfile)
    private agencyRepo: Repository<AgencyProfile>,
    private provincialRulesService: ProvincialRulesService,
  ) {}

  /**
   * Get compliance overview for agency dashboard
   */
  async getOverview(agencyId: string) {
    const records = await this.complianceRepo.find({
      where: { agency_id: agencyId },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activeItems = records.filter(r => r.status === 'active').length;
    const expiringItems = records.filter(r => 
      r.status === 'expiring' || 
      (r.expiry_date && r.expiry_date > now && r.expiry_date < thirtyDaysFromNow)
    ).length;
    const expiredItems = records.filter(r => 
      r.status === 'expired' || 
      (r.expiry_date && r.expiry_date < now)
    ).length;
    const totalItems = records.length || 1;

    // Calculate compliance scores by category
    const licenseRecords = records.filter(r => r.category === 'license');
    const trainingRecords = records.filter(r => r.category === 'training');
    const insuranceRecords = records.filter(r => r.category === 'insurance');
    const documentationRecords = records.filter(r => r.category === 'documentation');

    const calculateCategoryScore = (items: typeof records) => {
      if (items.length === 0) return 100;
      const activeCount = items.filter(i => i.status === 'active').length;
      return Math.round((activeCount / items.length) * 100);
    };

    const overallScore = Math.round((activeItems / totalItems) * 100);

    return {
      overallScore,
      status: overallScore >= 90 ? 'compliant' : overallScore >= 70 ? 'at_risk' : 'non_compliant',
      categories: {
        licensing: calculateCategoryScore(licenseRecords),
        training: calculateCategoryScore(trainingRecords),
        insurance: calculateCategoryScore(insuranceRecords),
        documentation: calculateCategoryScore(documentationRecords),
      },
      pendingItems: expiringItems,
      upcomingDeadlines: expiringItems,
      expiredItems,
      activeItems,
      totalItems: records.length,
      lastChecked: now.toISOString(),
    };
  }

  /**
   * Get compliance summary with categorized items
   */
  async getComplianceSummary(agencyId: string): Promise<ComplianceSummary> {
    const records = await this.complianceRepo.find({
      where: { agency_id: agencyId },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const allItems: ComplianceItem[] = records.map(r => ({
      id: r.id,
      type: r.category,
      name: r.name,
      status: this.calculateStatus(r.expiry_date) as ComplianceStatus,
      expiresAt: r.expiry_date,
      issuedAt: r.last_review_date,
      documentUrl: r.document_url,
    }));

    const activeItems = allItems.filter(i => i.status === ComplianceStatus.ACTIVE).length;
    const expiringItems = allItems.filter(i => i.status === ComplianceStatus.EXPIRING).length;
    const expiredItems = allItems.filter(i => i.status === ComplianceStatus.EXPIRED).length;
    const overallScore = allItems.length > 0 
      ? Math.round((activeItems / allItems.length) * 100) 
      : 100;

    return {
      overallScore,
      activeItems,
      expiringItems,
      expiredItems,
      byCategory: {
        licenses: allItems.filter(i => i.type.includes('license')),
        certifications: allItems.filter(i => 
          i.type.includes('certification') || 
          i.type.includes('cpr') || 
          i.type.includes('first_aid')
        ),
        training: allItems.filter(i => i.type.includes('training')),
        insurance: allItems.filter(i => i.type.includes('insurance')),
        background: allItems.filter(i => 
          i.type.includes('background') || 
          i.type.includes('criminal')
        ),
      },
    };
  }

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(agencyId: string): Promise<ComplianceAlert[]> {
    const summary = await this.getComplianceSummary(agencyId);
    const alerts: ComplianceAlert[] = [];
    const now = new Date();

    // Check for expired items
    const expiredItems = [
      ...summary.byCategory.licenses,
      ...summary.byCategory.certifications,
      ...summary.byCategory.training,
      ...summary.byCategory.insurance,
      ...summary.byCategory.background,
    ].filter(i => i.status === ComplianceStatus.EXPIRED);

    if (expiredItems.length > 0) {
      alerts.push({
        id: `expired-${Date.now()}`,
        type: 'expired',
        severity: 'critical',
        title: `${expiredItems.length} Compliance Items Expired`,
        description: 'These items have expired and require immediate attention',
        affectedItems: expiredItems,
        actionRequired: 'Renew or update expired documents immediately',
      });
    }

    // Check for expiring items
    const expiringItems = [
      ...summary.byCategory.licenses,
      ...summary.byCategory.certifications,
      ...summary.byCategory.training,
      ...summary.byCategory.insurance,
      ...summary.byCategory.background,
    ].filter(i => i.status === ComplianceStatus.EXPIRING);

    if (expiringItems.length > 0) {
      alerts.push({
        id: `expiring-${Date.now()}`,
        type: 'expiring',
        severity: expiringItems.length > 5 ? 'high' : 'medium',
        title: `${expiringItems.length} Items Expiring Soon`,
        description: 'These items will expire within the next 30 days',
        affectedItems: expiringItems,
        actionRequired: 'Schedule renewals to avoid compliance gaps',
        dueDate: expiringItems.reduce((earliest, item) => {
          if (!item.expiresAt) return earliest;
          return !earliest || item.expiresAt < earliest ? item.expiresAt : earliest;
        }, undefined as Date | undefined),
      });
    }

    // Check for missing provincial requirements
    const agency = await this.agencyRepo.findOne({ where: { id: agencyId } });
    if (agency?.business_province) {
      const requiredDocs = this.provincialRulesService.getRequiredDocuments(agency.business_province);
      const existingTypes = [...summary.byCategory.licenses, ...summary.byCategory.certifications]
        .map(i => i.type);
      
      const missingDocs = requiredDocs.filter(req => !existingTypes.includes(req));
      
      if (missingDocs.length > 0) {
        alerts.push({
          id: `missing-${Date.now()}`,
          type: 'missing',
          severity: 'high',
          title: 'Missing Provincial Requirements',
          description: `Your agency is missing ${missingDocs.length} required compliance items for ${agency.business_province}`,
          affectedItems: missingDocs.map(req => ({
            id: `missing-${req}`,
            type: req,
            name: req.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            status: ComplianceStatus.EXPIRED,
          })),
          actionRequired: 'Upload missing documents to ensure provincial compliance',
        });
      }
    }

    return alerts;
  }

  /**
   * Get compliance records with filtering
   */
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

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Create a compliance record
   */
  async createRecord(agencyId: string, dto: any) {
    const record = this.complianceRepo.create({ 
      ...dto, 
      agency_id: agencyId,
      status: this.calculateStatus(dto.expires_at),
    });
    return this.complianceRepo.save(record);
  }

  /**
   * Get a specific compliance record
   */
  async getRecord(agencyId: string, recordId: string) {
    const record = await this.complianceRepo.findOne({
      where: { id: recordId, agency_id: agencyId },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  /**
   * Update a compliance record
   */
  async updateRecord(agencyId: string, recordId: string, dto: any) {
    await this.getRecord(agencyId, recordId);
    if (dto.expires_at) {
      dto.status = this.calculateStatus(dto.expires_at);
    }
    await this.complianceRepo.update(recordId, dto);
    return this.getRecord(agencyId, recordId);
  }

  /**
   * Get certifications for agency caregivers
   */
  async getCertifications(agencyId: string) {
    return this.complianceRepo.find({
      where: { 
        agency_id: agencyId,
        category: 'certification',
      },
      order: { expiry_date: 'ASC' },
    });
  }

  /**
   * Get expiring certifications
   */
  async getExpiringCertifications(agencyId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.complianceRepo.find({
      where: {
        agency_id: agencyId,
        expiry_date: Between(new Date(), futureDate),
      },
      order: { expiry_date: 'ASC' },
    });
  }

  /**
   * Get compliance documents
   */
  async getDocuments(agencyId: string) {
    return this.complianceRepo.find({
      where: { agency_id: agencyId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Track a document upload
   */
  async uploadDocument(agencyId: string, dto: any) {
    const record = this.complianceRepo.create({
      agency_id: agencyId,
      category: dto.category || 'documentation',
      name: dto.type || dto.name,
      document_url: dto.documentUrl,
      last_review_date: dto.issuedAt ? new Date(dto.issuedAt) : new Date(),
      expiry_date: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      status: this.calculateStatus(dto.expiresAt ? new Date(dto.expiresAt) : undefined),
      metadata: dto.metadata,
    });

    const saved = await this.complianceRepo.save(record);
    this.logger.log(`✅ Compliance document uploaded for agency ${agencyId}: ${dto.type}`);
    
    return saved;
  }

  /**
   * Get audit history
   */
  async getAudits(agencyId: string) {
    return this.complianceRepo.find({
      where: { 
        agency_id: agencyId,
        category: 'audit',
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get audit readiness score
   */
  async getAuditReadiness(agencyId: string) {
    const summary = await this.getComplianceSummary(agencyId);
    const alerts = await this.getComplianceAlerts(agencyId);

    const gaps = alerts.flatMap(a => a.affectedItems.map(i => ({
      type: i.type,
      issue: a.title,
      severity: a.severity,
    })));

    const recommendations: string[] = [];

    if (summary.expiredItems > 0) {
      recommendations.push(`Renew ${summary.expiredItems} expired compliance items immediately`);
    }

    if (summary.expiringItems > 0) {
      recommendations.push(`Schedule renewals for ${summary.expiringItems} items expiring soon`);
    }

    const missingAlert = alerts.find(a => a.type === 'missing');
    if (missingAlert) {
      recommendations.push(`Upload ${missingAlert.affectedItems.length} missing provincial documents`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance practices');
      recommendations.push('Schedule regular compliance reviews');
    }

    const score = summary.overallScore;
    const status = score >= 90 ? 'ready' : score >= 70 ? 'needs_attention' : 'not_ready';

    return {
      score,
      status,
      gaps,
      recommendations,
      lastAuditDate: null,
      nextAuditDue: null,
      summary: {
        total: summary.activeItems + summary.expiringItems + summary.expiredItems,
        active: summary.activeItems,
        expiring: summary.expiringItems,
        expired: summary.expiredItems,
      },
    };
  }

  /**
   * Get provincial compliance requirements
   */
  async getProvincialRequirements(agencyId: string) {
    const agency = await this.agencyRepo.findOne({ where: { id: agencyId } });
    if (!agency?.business_province) {
      return { requirements: [], province: 'Unknown' };
    }

    const rules = this.provincialRulesService.getRulesForProvince(agency.business_province);
    const requiredDocs = this.provincialRulesService.getRequiredDocuments(agency.business_province);

    return {
      province: agency.business_province,
      provinceName: rules.provinceName,
      requirements: requiredDocs,
      laborRules: {
        minRestBetweenShifts: rules.minRestBetweenShiftsHours,
        maxDailyHours: rules.maxDailyHours,
        overtimeThreshold: rules.overtimeThresholdWeeklyHours,
        maxConsecutiveDays: rules.maxConsecutiveDays,
      },
    };
  }

  // Private helper methods

  private calculateStatus(expiresAt?: Date): string {
    if (!expiresAt) return 'active';
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiresAt < now) {
      return 'expired';
    } else if (expiresAt < thirtyDaysFromNow) {
      return 'expiring';
    } else {
      return 'active';
    }
  }
}



import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan, IsNull } from 'typeorm';
import { AuditLog, AuditSeverity } from '../entities/audit-log-enhanced.entity';
import { ComplianceRecord } from '../entities/compliance-record.entity';
import { CreateAuditLogDto, QueryAuditLogsDto } from '../dto/audit.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog) 
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(ComplianceRecord) 
    private readonly complianceRepo: Repository<ComplianceRecord>
  ) {}

  async createAuditLog(dto: CreateAuditLogDto): Promise<AuditLog> {
    const startTime = Date.now();
    
    try {
      // Calculate risk score based on event type and context
      const riskScore = this.calculateRiskScore(dto);
      
      // Determine if PHI was accessed
      const phiAccessed = this.checkPHIAccess(dto);
      
      // Create audit log
      const log = this.auditRepo.create({
        eventType: dto.eventType || dto.action,
        severity: dto.severity || AuditSeverity.INFO,
        userId: dto.actorId || dto.userId,
        entityType: dto.entityType || dto.resourceType,
        entityId: dto.entityId || dto.resourceId,
        ipAddress: dto.ipAddress || dto.metadata?.ipAddress || '0.0.0.0',
        userAgent: dto.userAgent || dto.metadata?.userAgent,
        sessionId: dto.sessionId,
        requestId: dto.requestId,
        description: dto.description || `${dto.action} on ${dto.entityType}`,
        metadata: dto.metadata || {},
        phiAccessed,
        patientId: dto.patientId || dto.metadata?.patientId,
        accessReason: dto.accessReason || dto.metadata?.accessReason,
        authorizationId: dto.authorizationId,
        riskScore,
        flaggedForReview: riskScore > 70 || dto.metadata?.suspicious === true,
      });

      const saved = await this.auditRepo.save(log);

      // Async compliance check
      this.performComplianceCheck(saved).catch(err => 
        this.logger.error(`Compliance check failed: ${err.message}`)
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`Audit log created in ${duration}ms`);

      return saved;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to create audit log after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  async getAuditLogs(filters: QueryAuditLogsDto): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.auditRepo.createQueryBuilder('log');

    if (filters.userId) {
      query.andWhere('log.user_id = :userId', { userId: filters.userId });
    }

    if (filters.eventType) {
      query.andWhere('log.event_type = :eventType', { eventType: filters.eventType });
    }

    if (filters.entityType && filters.entityId) {
      query.andWhere('log.entity_type = :entityType AND log.entity_id = :entityId', {
        entityType: filters.entityType,
        entityId: filters.entityId,
      });
    }

    if (filters.severity) {
      query.andWhere('log.severity = :severity', { severity: filters.severity });
    }

    if (filters.phiAccessed !== undefined) {
      query.andWhere('log.phi_accessed = :phiAccessed', { phiAccessed: filters.phiAccessed });
    }

    if (filters.flaggedOnly) {
      query.andWhere('log.flagged_for_review = true');
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('log.created_at BETWEEN :start AND :end', {
        start: new Date(filters.startDate),
        end: new Date(filters.endDate),
      });
    }

    // Add search capability
    if (filters.search) {
      query.andWhere(
        '(log.description ILIKE :search OR log.event_type ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('log.created_at', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getManyAndCount();

    return { data, total };
  }

  async getComplianceStatus(): Promise<any> {
    const records = await this.complianceRepo.find({
      order: { regulationType: 'ASC', requirementId: 'ASC' }
    });

    const overdue = await this.complianceRepo.count({
      where: {
        nextReviewDate: MoreThan(new Date()),
        status: In(['pending_review', 'non_compliant'])
      }
    });

    const summary = records.reduce((acc: any, record) => {
      if (!acc[record.regulationType]) {
        acc[record.regulationType] = {
          compliant: 0,
          non_compliant: 0,
          pending_review: 0,
          exception_granted: 0,
          total: 0
        };
      }
      acc[record.regulationType][record.status]++;
      acc[record.regulationType].total++;
      return acc;
    }, {});

    return { 
      records, 
      summary,
      overdue,
      lastUpdated: new Date(),
    };
  }

  async updateComplianceRecord(data: any): Promise<ComplianceRecord> {
    const existing = await this.complianceRepo.findOne({
      where: { 
        regulationType: data.regulationType,
        requirementId: data.requirementId 
      }
    });

    if (existing) {
      Object.assign(existing, data, {
        lastReviewDate: new Date(),
        updatedAt: new Date(),
      });
      
      // Calculate next review date
      existing.nextReviewDate = new Date();
      existing.nextReviewDate.setDate(
        existing.nextReviewDate.getDate() + (existing.reviewFrequencyDays || 90)
      );
      
      return this.complianceRepo.save(existing);
    }

    const record = this.complianceRepo.create({
      ...data,
      lastReviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + (data.reviewFrequencyDays || 90) * 24 * 60 * 60 * 1000),
    });
    
    return await this.complianceRepo.save(record) as unknown as ComplianceRecord;
  }

  async generateHIPAAReport(): Promise<any> {
    const hipaaRecords = await this.complianceRepo.find({
      where: { regulationType: 'HIPAA' },
      order: { requirementId: 'ASC' }
    });

    // PHI Access Summary
    const phiAccessLogs = await this.auditRepo
      .createQueryBuilder('log')
      .select('COUNT(*)', 'total')
      .addSelect('DATE(log.created_at)', 'date')
      .where('log.phi_accessed = true')
      .andWhere('log.created_at >= :start', {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
      .groupBy('DATE(log.created_at)')
      .getRawMany();

    // Unauthorized Access Attempts
    const unauthorizedAccess = await this.auditRepo.count({
      where: {
        eventType: In(['UNAUTHORIZED_PHI_ACCESS', 'ACCESS_DENIED', 'PERMISSION_VIOLATION']),
        createdAt: MoreThan(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      }
    });

    // High Risk Events
    const highRiskEvents = await this.auditRepo.find({
      where: {
        riskScore: MoreThan(80),
        createdAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      },
      order: { riskScore: 'DESC' },
      take: 10
    });

    // Data Export Summary
    const dataExports = await this.auditRepo.count({
      where: {
        eventType: In(['DATA_EXPORT', 'BULK_DOWNLOAD', 'REPORT_GENERATED']),
        phiAccessed: true,
        createdAt: MoreThan(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      }
    });

    return {
      generatedAt: new Date(),
      reportPeriod: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      compliance: {
        records: hipaaRecords,
        score: this.calculateComplianceScore(hipaaRecords),
        criticalGaps: hipaaRecords.filter(r => 
          r.status === 'non_compliant' && r.riskLevel === 'critical'
        )
      },
      phiAccess: {
        last30Days: phiAccessLogs,
        unauthorizedAttempts: unauthorizedAccess,
        dataExports
      },
      risks: {
        highRiskEvents,
        flaggedForReview: await this.auditRepo.count({ 
          where: { flaggedForReview: true, reviewedAt: IsNull() } 
        })
      },
      recommendations: this.generateRecommendations(hipaaRecords, highRiskEvents)
    };
  }

  private calculateRiskScore(dto: CreateAuditLogDto): number {
    let score = 0;

    // Event type risk
    const highRiskEvents = [
      'DATA_EXPORT', 'PERMISSION_CHANGE', 'USER_ROLE_MODIFIED',
      'BULK_DELETE', 'SECURITY_SETTING_CHANGED', 'AUDIT_LOG_ACCESSED'
    ];
    
    const eventType = dto.eventType || dto.action || '';
    if (highRiskEvents.includes(eventType)) {
      score += 30;
    }

    // PHI access risk
    if (dto.metadata?.phiAccessed || dto.patientId) {
      score += 20;
    }

    // Time-based risk (access outside business hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 15;
    }

    // Unusual access patterns
    if (dto.metadata?.unusualActivity) {
      score += 25;
    }

    // Failed authentication attempts
    if (dto.eventType?.includes('FAILED') || dto.metadata?.failed) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private checkPHIAccess(dto: CreateAuditLogDto): boolean {
    const phiEntities = ['patient', 'medical_record', 'prescription', 'lab_result', 'diagnosis'];
    const phiEvents = ['PHI_ACCESS', 'PATIENT_DATA_VIEW', 'MEDICAL_RECORD_ACCESS'];

    return (
      phiEntities.includes(dto.entityType?.toLowerCase() || '') ||
      phiEvents.includes(dto.eventType || '') ||
      dto.metadata?.phiAccessed === true ||
      dto.patientId !== undefined
    );
  }

  private async performComplianceCheck(log: AuditLog): Promise<void> {
    // Check for suspicious patterns
    if (log.phiAccessed && !log.accessReason) {
      await this.createComplianceAlert('PHI_ACCESS_WITHOUT_REASON', log);
    }

    // Check for bulk data access
    const recentBulkAccess = await this.auditRepo.count({
      where: {
        userId: log.userId,
        eventType: In(['DATA_EXPORT', 'BULK_DOWNLOAD']),
        createdAt: MoreThan(new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      }
    });

    if (recentBulkAccess > 5) {
      await this.createComplianceAlert('EXCESSIVE_BULK_ACCESS', log);
    }
  }

  private async createComplianceAlert(alertType: string, log: AuditLog): Promise<void> {
    // In a real system, this would create an alert for security team
    this.logger.warn(`Compliance alert: ${alertType} for log ${log.id}`);
    
    // Flag the log for review
    log.flaggedForReview = true;
    log.riskScore = Math.min(log.riskScore + 20, 100);
    await this.auditRepo.save(log);
  }

  private calculateComplianceScore(records: ComplianceRecord[]): number {
    if (records.length === 0) return 0;
    
    const weightedScores = records.map(record => {
      const statusScore = {
        compliant: 100,
        exception_granted: 80,
        pending_review: 50,
        non_compliant: 0
      }[record.status] || 0;

      const riskMultiplier = {
        critical: 2.0,
        high: 1.5,
        medium: 1.0,
        low: 0.5
      }[record.riskLevel || 'medium'] || 1.0;

      return statusScore * riskMultiplier;
    });

    const totalWeight = records.reduce((sum, record) => {
      const riskWeight = {
        critical: 2.0,
        high: 1.5,
        medium: 1.0,
        low: 0.5
      }[record.riskLevel || 'medium'] || 1.0;
      return sum + riskWeight;
    }, 0);

    const weightedSum = weightedScores.reduce((sum, score) => sum + score, 0);
    return Math.round(weightedSum / totalWeight);
  }

  private generateRecommendations(
    complianceRecords: ComplianceRecord[], 
    highRiskEvents: AuditLog[]
  ): string[] {
    const recommendations: string[] = [];

    // Check compliance gaps
    const nonCompliant = complianceRecords.filter(r => r.status === 'non_compliant');
    if (nonCompliant.length > 0) {
      recommendations.push(
        `Address ${nonCompliant.length} non-compliant HIPAA requirements immediately`
      );
    }

    // Check overdue reviews
    const overdue = complianceRecords.filter(r => 
      r.nextReviewDate && r.nextReviewDate < new Date()
    );
    if (overdue.length > 0) {
      recommendations.push(
        `Complete overdue compliance reviews for ${overdue.length} requirements`
      );
    }

    // Check high risk events
    if (highRiskEvents.length > 5) {
      recommendations.push(
        'Investigate high volume of high-risk events in the past 30 days'
      );
    }

    // Check for missing compensating controls
    const criticalWithoutControls = complianceRecords.filter(r => 
      r.riskLevel === 'critical' && 
      (!r.compensatingControls || r.compensatingControls.length === 0)
    );
    if (criticalWithoutControls.length > 0) {
      recommendations.push(
        `Implement compensating controls for ${criticalWithoutControls.length} critical requirements`
      );
    }

    return recommendations;
  }
}

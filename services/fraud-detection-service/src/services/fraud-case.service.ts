import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { FraudCase } from '../entities/fraud-case.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { FraudCaseStatus, FraudRiskLevel } from '../interfaces/fraud.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fraud Case Service
 * Manages fraud investigation cases
 */
@Injectable()
export class FraudCaseService {
  private readonly logger = new Logger(FraudCaseService.name);

  constructor(
    @InjectRepository(FraudCase)
    private readonly caseRepo: Repository<FraudCase>,
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
  ) {}

  /**
   * Create a new fraud case
   */
  async createCase(data: {
    userId: string;
    title: string;
    description?: string;
    riskLevel: FraudRiskLevel;
    eventIds?: string[];
    assignedTo?: string;
  }): Promise<FraudCase> {
    const caseNumber = this.generateCaseNumber();

    // Calculate total risk score from events
    let totalRiskScore = 0;
    if (data.eventIds && data.eventIds.length > 0) {
      const events = await this.eventRepo.find({
        where: { id: In(data.eventIds) },
      });
      totalRiskScore = events.reduce((sum, e) => sum + Number(e.riskScore), 0) / events.length;
    }

    const fraudCase = this.caseRepo.create({
      caseNumber,
      userId: data.userId,
      title: data.title,
      description: data.description,
      riskLevel: data.riskLevel,
      status: FraudCaseStatus.OPEN,
      eventIds: data.eventIds || [],
      totalRiskScore,
      assignedTo: data.assignedTo,
      notes: [],
    });

    const saved = await this.caseRepo.save(fraudCase);
    this.logger.log(`Created fraud case ${caseNumber} for user ${data.userId}`);
    return saved;
  }

  /**
   * Get a fraud case by ID
   */
  async getCase(id: string): Promise<FraudCase> {
    const fraudCase = await this.caseRepo.findOne({ where: { id } });
    if (!fraudCase) {
      throw new NotFoundException('Fraud case not found');
    }
    return fraudCase;
  }

  /**
   * Get case by case number
   */
  async getCaseByCaseNumber(caseNumber: string): Promise<FraudCase> {
    const fraudCase = await this.caseRepo.findOne({ where: { caseNumber } });
    if (!fraudCase) {
      throw new NotFoundException('Fraud case not found');
    }
    return fraudCase;
  }

  /**
   * Get cases with filters
   */
  async getCases(filters: {
    userId?: string;
    status?: FraudCaseStatus;
    riskLevel?: FraudRiskLevel;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ cases: FraudCase[]; total: number }> {
    const qb = this.caseRepo.createQueryBuilder('case');

    if (filters.userId) {
      qb.andWhere('case.userId = :userId', { userId: filters.userId });
    }
    if (filters.status) {
      qb.andWhere('case.status = :status', { status: filters.status });
    }
    if (filters.riskLevel) {
      qb.andWhere('case.riskLevel = :riskLevel', { riskLevel: filters.riskLevel });
    }
    if (filters.assignedTo) {
      qb.andWhere('case.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.startDate && filters.endDate) {
      qb.andWhere('case.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [cases, total] = await qb
      .orderBy('case.createdAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getManyAndCount();

    return { cases, total };
  }

  /**
   * Update case status
   */
  async updateStatus(id: string, status: FraudCaseStatus, updatedBy: string): Promise<FraudCase> {
    const fraudCase = await this.getCase(id);

    fraudCase.status = status;

    if (status === FraudCaseStatus.RESOLVED_FRAUD || status === FraudCaseStatus.RESOLVED_LEGITIMATE) {
      fraudCase.resolvedAt = new Date();
      fraudCase.resolvedBy = updatedBy;
      fraudCase.isFraudConfirmed = status === FraudCaseStatus.RESOLVED_FRAUD;
    }

    return this.caseRepo.save(fraudCase);
  }

  /**
   * Assign case to investigator
   */
  async assignCase(id: string, assignedTo: string): Promise<FraudCase> {
    const fraudCase = await this.getCase(id);
    fraudCase.assignedTo = assignedTo;
    fraudCase.status = FraudCaseStatus.INVESTIGATING;
    return this.caseRepo.save(fraudCase);
  }

  /**
   * Escalate case
   */
  async escalateCase(id: string, escalatedTo: string, reason: string): Promise<FraudCase> {
    const fraudCase = await this.getCase(id);
    fraudCase.escalatedTo = escalatedTo;
    fraudCase.escalatedAt = new Date();
    fraudCase.escalationReason = reason;
    fraudCase.status = FraudCaseStatus.ESCALATED;
    return this.caseRepo.save(fraudCase);
  }

  /**
   * Add note to case
   */
  async addNote(id: string, authorId: string, content: string): Promise<FraudCase> {
    const fraudCase = await this.getCase(id);
    fraudCase.notes.push({
      id: uuidv4(),
      authorId,
      content,
      createdAt: new Date(),
    });
    return this.caseRepo.save(fraudCase);
  }

  /**
   * Add events to case
   */
  async addEventsToCase(id: string, eventIds: string[]): Promise<FraudCase> {
    const fraudCase = await this.getCase(id);
    const uniqueEventIds = [...new Set([...fraudCase.eventIds, ...eventIds])];
    fraudCase.eventIds = uniqueEventIds;

    // Recalculate risk score
    const events = await this.eventRepo.find({
      where: { id: In(uniqueEventIds) },
    });
    fraudCase.totalRiskScore = events.reduce((sum, e) => sum + Number(e.riskScore), 0) / events.length;

    return this.caseRepo.save(fraudCase);
  }

  /**
   * Resolve case
   */
  async resolveCase(id: string, data: {
    resolvedBy: string;
    isFraudConfirmed: boolean;
    resolution: string;
    amountRecovered?: number;
  }): Promise<FraudCase> {
    const fraudCase = await this.getCase(id);

    fraudCase.status = data.isFraudConfirmed
      ? FraudCaseStatus.RESOLVED_FRAUD
      : FraudCaseStatus.RESOLVED_LEGITIMATE;
    fraudCase.resolvedAt = new Date();
    fraudCase.resolvedBy = data.resolvedBy;
    fraudCase.isFraudConfirmed = data.isFraudConfirmed;
    fraudCase.resolution = data.resolution;
    if (data.amountRecovered !== undefined) {
      fraudCase.amountRecovered = data.amountRecovered;
    }

    return this.caseRepo.save(fraudCase);
  }

  /**
   * Get case statistics
   */
  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalCases: number;
    openCases: number;
    resolvedFraud: number;
    resolvedLegitimate: number;
    averageResolutionTime: number;
    byRiskLevel: Record<FraudRiskLevel, number>;
    byStatus: Record<FraudCaseStatus, number>;
  }> {
    const where: Record<string, unknown> = {};
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const cases = await this.caseRepo.find({ where });

    const stats = {
      totalCases: cases.length,
      openCases: cases.filter((c) => c.status === FraudCaseStatus.OPEN).length,
      resolvedFraud: cases.filter((c) => c.status === FraudCaseStatus.RESOLVED_FRAUD).length,
      resolvedLegitimate: cases.filter((c) => c.status === FraudCaseStatus.RESOLVED_LEGITIMATE).length,
      averageResolutionTime: 0,
      byRiskLevel: {} as Record<FraudRiskLevel, number>,
      byStatus: {} as Record<FraudCaseStatus, number>,
    };

    // Calculate average resolution time
    const resolvedCases = cases.filter((c) => c.resolvedAt);
    if (resolvedCases.length > 0) {
      const totalTime = resolvedCases.reduce((sum, c) => {
        return sum + (c.resolvedAt!.getTime() - c.createdAt.getTime());
      }, 0);
      stats.averageResolutionTime = totalTime / resolvedCases.length / (1000 * 60 * 60); // hours
    }

    // Count by risk level
    for (const level of Object.values(FraudRiskLevel)) {
      stats.byRiskLevel[level] = cases.filter((c) => c.riskLevel === level).length;
    }

    // Count by status
    for (const status of Object.values(FraudCaseStatus)) {
      stats.byStatus[status] = cases.filter((c) => c.status === status).length;
    }

    return stats;
  }

  /**
   * Generate unique case number
   */
  private generateCaseNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FRD-${year}${month}-${random}`;
  }
}


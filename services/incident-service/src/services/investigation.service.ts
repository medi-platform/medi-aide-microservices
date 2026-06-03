import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IncidentInvestigation,
  InvestigationStatus,
  InvestigationPriority,
} from '../entities/incident-investigation.entity';
import { IncidentCategory, CategorySeverity } from '../entities/incident-category.entity';
import { IncidentWitness, StatementStatus, WitnessType } from '../entities/incident-witness.entity';

@Injectable()
export class InvestigationService {
  private readonly logger = new Logger(InvestigationService.name);

  constructor(
    @InjectRepository(IncidentInvestigation)
    private readonly investigationRepo: Repository<IncidentInvestigation>,
    @InjectRepository(IncidentCategory)
    private readonly categoryRepo: Repository<IncidentCategory>,
    @InjectRepository(IncidentWitness)
    private readonly witnessRepo: Repository<IncidentWitness>,
  ) {}

  // Category Management
  async createCategory(dto: {
    code: string;
    name: string;
    nameFr?: string;
    description?: string;
    parentId?: string;
    defaultSeverity?: CategorySeverity;
    requiresInvestigation?: boolean;
    requiresNotification?: boolean;
  }): Promise<IncidentCategory> {
    const category = this.categoryRepo.create({
      ...dto,
      defaultSeverity: dto.defaultSeverity || CategorySeverity.MEDIUM,
    });
    return this.categoryRepo.save(category);
  }

  async listCategories(activeOnly: boolean = true): Promise<IncidentCategory[]> {
    const where: any = {};
    if (activeOnly) where.isActive = true;
    return this.categoryRepo.find({ where, order: { order: 'ASC', name: 'ASC' } });
  }

  async getCategory(id: string): Promise<IncidentCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  // Witness Management
  async addWitness(dto: {
    incidentId: string;
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    witnessType: string;
    relationship?: string;
  }): Promise<IncidentWitness> {
    const witness = this.witnessRepo.create({
      ...dto,
      witnessType: dto.witnessType as WitnessType,
    });
    return this.witnessRepo.save(witness);
  }

  async getIncidentWitnesses(incidentId: string): Promise<IncidentWitness[]> {
    return this.witnessRepo.find({ where: { incidentId } });
  }

  async recordStatement(
    witnessId: string,
    statement: string,
    takenBy: string,
  ): Promise<IncidentWitness> {
    const witness = await this.witnessRepo.findOne({ where: { id: witnessId } });
    if (!witness) throw new NotFoundException('Witness not found');

    witness.statement = statement;
    witness.statementStatus = StatementStatus.RECEIVED;
    witness.statementDate = new Date();
    witness.statementTakenBy = takenBy;

    return this.witnessRepo.save(witness);
  }

  // Investigation Management
  async createInvestigation(dto: {
    incidentId: string;
    priority?: InvestigationPriority;
    leadInvestigatorId?: string;
    dueDate?: Date;
    scope?: string;
  }): Promise<IncidentInvestigation> {
    const investigation = this.investigationRepo.create({
      ...dto,
      status: InvestigationStatus.PENDING,
      priority: dto.priority || InvestigationPriority.NORMAL,
    });
    return this.investigationRepo.save(investigation);
  }

  async getInvestigation(id: string): Promise<IncidentInvestigation> {
    const investigation = await this.investigationRepo.findOne({ where: { id } });
    if (!investigation) throw new NotFoundException(`Investigation ${id} not found`);
    return investigation;
  }

  async getIncidentInvestigation(incidentId: string): Promise<IncidentInvestigation | null> {
    return this.investigationRepo.findOne({ where: { incidentId } });
  }

  async assignInvestigator(
    investigationId: string,
    investigatorId: string,
    assignedBy: string,
  ): Promise<IncidentInvestigation> {
    const investigation = await this.getInvestigation(investigationId);
    investigation.leadInvestigatorId = investigatorId;
    investigation.assignedBy = assignedBy;
    investigation.assignedAt = new Date();
    investigation.status = InvestigationStatus.IN_PROGRESS;
    investigation.startedAt = new Date();
    return this.investigationRepo.save(investigation);
  }

  async updateFindings(
    investigationId: string,
    findings: {
      findings?: string;
      rootCause?: string;
      contributingFactors?: string[];
    },
  ): Promise<IncidentInvestigation> {
    const investigation = await this.getInvestigation(investigationId);
    Object.assign(investigation, findings);
    return this.investigationRepo.save(investigation);
  }

  async addRecommendation(
    investigationId: string,
    recommendation: {
      description: string;
      priority: 'low' | 'medium' | 'high';
      assignedTo?: string;
      dueDate?: Date;
    },
  ): Promise<IncidentInvestigation> {
    const investigation = await this.getInvestigation(investigationId);
    const recommendations = investigation.recommendations || [];
    recommendations.push({
      id: `rec_${Date.now()}`,
      ...recommendation,
      status: 'pending',
    });
    investigation.recommendations = recommendations;
    return this.investigationRepo.save(investigation);
  }

  async completeInvestigation(
    investigationId: string,
    reportUrl?: string,
  ): Promise<IncidentInvestigation> {
    const investigation = await this.getInvestigation(investigationId);
    investigation.status = InvestigationStatus.COMPLETED;
    investigation.completedAt = new Date();
    if (reportUrl) {
      investigation.reportUrl = reportUrl;
      investigation.reportGeneratedAt = new Date();
    }
    return this.investigationRepo.save(investigation);
  }

  async getPendingInvestigations(): Promise<IncidentInvestigation[]> {
    return this.investigationRepo.find({
      where: [
        { status: InvestigationStatus.PENDING },
        { status: InvestigationStatus.IN_PROGRESS },
      ],
      order: { priority: 'DESC', dueDate: 'ASC' },
    });
  }
}

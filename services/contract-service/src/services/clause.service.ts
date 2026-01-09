import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContractClause,
  ClauseCategory,
  ClauseStatus,
} from '../entities/contract-clause.entity';

interface CreateClauseDto {
  key: string;
  name: string;
  description?: string;
  category: ClauseCategory;
  jurisdiction: string;
  contentEn: string;
  contentFr?: string;
  legalReference?: string;
  isMandatory?: boolean;
  mandatoryForTypes?: string[];
  mandatoryForJurisdictions?: string[];
  placeholders?: ContractClause['placeholders'];
  createdBy?: string;
}

interface UpdateClauseDto {
  name?: string;
  description?: string;
  contentEn?: string;
  contentFr?: string;
  legalReference?: string;
  isMandatory?: boolean;
  mandatoryForTypes?: string[];
  mandatoryForJurisdictions?: string[];
  placeholders?: ContractClause['placeholders'];
}

@Injectable()
export class ClauseService {
  private readonly logger = new Logger(ClauseService.name);

  constructor(
    @InjectRepository(ContractClause)
    private readonly clauseRepo: Repository<ContractClause>,
  ) {}

  async createClause(dto: CreateClauseDto): Promise<ContractClause> {
    // Check for duplicate key
    const existing = await this.clauseRepo.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Clause with key '${dto.key}' already exists`);
    }

    const clause = this.clauseRepo.create({
      ...dto,
      status: ClauseStatus.DRAFT,
      version: 1,
    });

    await this.clauseRepo.save(clause);

    this.logger.log(`Clause ${clause.id} (${dto.key}) created`);

    return clause;
  }

  async getClause(id: string): Promise<ContractClause> {
    const clause = await this.clauseRepo.findOne({ where: { id } });
    if (!clause) {
      throw new NotFoundException(`Clause ${id} not found`);
    }
    return clause;
  }

  async getClauseByKey(key: string): Promise<ContractClause> {
    const clause = await this.clauseRepo.findOne({ where: { key } });
    if (!clause) {
      throw new NotFoundException(`Clause with key '${key}' not found`);
    }
    return clause;
  }

  async updateClause(id: string, dto: UpdateClauseDto): Promise<ContractClause> {
    const clause = await this.getClause(id);

    // If clause is active, create a new version
    if (clause.status === ClauseStatus.ACTIVE && (dto.contentEn || dto.contentFr)) {
      clause.version += 1;
      this.logger.log(`Clause ${id} versioned to v${clause.version}`);
    }

    Object.assign(clause, dto);
    return this.clauseRepo.save(clause);
  }

  async approveClause(
    id: string,
    approvedBy: string,
  ): Promise<ContractClause> {
    const clause = await this.getClause(id);

    if (clause.status !== ClauseStatus.DRAFT) {
      throw new BadRequestException('Only draft clauses can be approved');
    }

    clause.status = ClauseStatus.ACTIVE;
    clause.approvedBy = approvedBy;
    clause.approvedAt = new Date();

    return this.clauseRepo.save(clause);
  }

  async legalReviewClause(
    id: string,
    reviewedBy: string,
  ): Promise<ContractClause> {
    const clause = await this.getClause(id);

    clause.legalReviewedBy = reviewedBy;
    clause.legalReviewedAt = new Date();

    return this.clauseRepo.save(clause);
  }

  async archiveClause(id: string): Promise<ContractClause> {
    const clause = await this.getClause(id);

    clause.status = ClauseStatus.ARCHIVED;
    return this.clauseRepo.save(clause);
  }

  async deprecateClause(id: string): Promise<ContractClause> {
    const clause = await this.getClause(id);

    clause.status = ClauseStatus.DEPRECATED;
    return this.clauseRepo.save(clause);
  }

  async listClauses(options?: {
    category?: ClauseCategory;
    status?: ClauseStatus;
    jurisdiction?: string;
    isMandatory?: boolean;
  }): Promise<ContractClause[]> {
    const where: any = {};

    if (options?.category) where.category = options.category;
    if (options?.status) where.status = options.status;
    if (options?.jurisdiction) where.jurisdiction = options.jurisdiction;
    if (options?.isMandatory !== undefined) where.isMandatory = options.isMandatory;

    return this.clauseRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getActiveClauses(jurisdiction?: string): Promise<ContractClause[]> {
    const where: any = { status: ClauseStatus.ACTIVE };
    if (jurisdiction) where.jurisdiction = jurisdiction;

    return this.clauseRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getMandatoryClauses(
    contractType: string,
    jurisdiction: string,
  ): Promise<ContractClause[]> {
    // Get clauses mandatory for the contract type or jurisdiction
    const clauses = await this.clauseRepo.find({
      where: { status: ClauseStatus.ACTIVE, isMandatory: true },
    });

    // Filter based on type and jurisdiction
    return clauses.filter((clause) => {
      const matchesType =
        !clause.mandatoryForTypes ||
        clause.mandatoryForTypes.includes(contractType);
      const matchesJurisdiction =
        !clause.mandatoryForJurisdictions ||
        clause.mandatoryForJurisdictions.some(
          (j) => jurisdiction.startsWith(j) || j === jurisdiction,
        );

      return matchesType && matchesJurisdiction;
    });
  }

  async renderClause(
    id: string,
    data: Record<string, any>,
    locale: 'en' | 'fr' = 'en',
  ): Promise<string> {
    const clause = await this.getClause(id);

    let content = locale === 'fr' && clause.contentFr ? clause.contentFr : clause.contentEn;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    return content;
  }

  async cloneClause(
    id: string,
    newKey: string,
    newName: string,
    createdBy?: string,
  ): Promise<ContractClause> {
    const original = await this.getClause(id);

    const existing = await this.clauseRepo.findOne({ where: { key: newKey } });
    if (existing) {
      throw new ConflictException(`Clause with key '${newKey}' already exists`);
    }

    const clone = this.clauseRepo.create({
      key: newKey,
      name: newName,
      description: `Clone of ${original.name}`,
      category: original.category,
      status: ClauseStatus.DRAFT,
      jurisdiction: original.jurisdiction,
      contentEn: original.contentEn,
      contentFr: original.contentFr,
      legalReference: original.legalReference,
      isMandatory: false,
      placeholders: original.placeholders,
      version: 1,
      createdBy,
      metadata: { clonedFrom: original.id },
    });

    await this.clauseRepo.save(clone);

    this.logger.log(`Clause ${id} cloned to ${clone.id} (${newKey})`);

    return clone;
  }
}

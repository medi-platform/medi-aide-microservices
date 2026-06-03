import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReportDefinition,
  ReportCategory,
  ReportStatus,
  OutputFormat,
} from '../entities/report-definition.entity';

interface CreateDefinitionDto {
  key: string;
  name: string;
  nameFr?: string;
  description?: string;
  descriptionFr?: string;
  category: ReportCategory;
  isSystem?: boolean;
  supportedFormats: OutputFormat[];
  defaultFormat?: OutputFormat;
  dataSource: string;
  queryTemplate?: string;
  parameters?: ReportDefinition['parameters'];
  requiredPermissions?: string[];
  agencySpecific?: boolean;
  templateConfig?: ReportDefinition['templateConfig'];
}

@Injectable()
export class ReportDefinitionService {
  private readonly logger = new Logger(ReportDefinitionService.name);

  constructor(
    @InjectRepository(ReportDefinition)
    private readonly definitionRepo: Repository<ReportDefinition>,
  ) {}

  async createDefinition(dto: CreateDefinitionDto): Promise<ReportDefinition> {
    const existing = await this.definitionRepo.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Report definition with key '${dto.key}' already exists`);
    }

    const definition = this.definitionRepo.create({
      ...dto,
      status: ReportStatus.DRAFT,
      defaultFormat: dto.defaultFormat || OutputFormat.PDF,
    });

    return this.definitionRepo.save(definition);
  }

  async getDefinition(id: string): Promise<ReportDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { id } });
    if (!definition) {
      throw new NotFoundException(`Report definition ${id} not found`);
    }
    return definition;
  }

  async getDefinitionByKey(key: string): Promise<ReportDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { key } });
    if (!definition) {
      throw new NotFoundException(`Report definition '${key}' not found`);
    }
    return definition;
  }

  async updateDefinition(id: string, dto: Partial<CreateDefinitionDto>): Promise<ReportDefinition> {
    const definition = await this.getDefinition(id);

    if (dto.key && dto.key !== definition.key) {
      const existing = await this.definitionRepo.findOne({ where: { key: dto.key } });
      if (existing) {
        throw new ConflictException(`Report definition with key '${dto.key}' already exists`);
      }
    }

    Object.assign(definition, dto);
    return this.definitionRepo.save(definition);
  }

  async activateDefinition(id: string): Promise<ReportDefinition> {
    const definition = await this.getDefinition(id);
    definition.status = ReportStatus.ACTIVE;
    return this.definitionRepo.save(definition);
  }

  async deprecateDefinition(id: string): Promise<ReportDefinition> {
    const definition = await this.getDefinition(id);
    definition.status = ReportStatus.DEPRECATED;
    return this.definitionRepo.save(definition);
  }

  async listDefinitions(
    category?: ReportCategory,
    status?: ReportStatus,
  ): Promise<ReportDefinition[]> {
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    return this.definitionRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getAvailableReports(
    userPermissions: string[],
    agencyId?: string,
  ): Promise<ReportDefinition[]> {
    const definitions = await this.listDefinitions(undefined, ReportStatus.ACTIVE);

    return definitions.filter(def => {
      // Check permissions
      if (def.requiredPermissions && def.requiredPermissions.length > 0) {
        const hasPermission = def.requiredPermissions.some(p => userPermissions.includes(p));
        if (!hasPermission) return false;
      }

      // Check agency-specific
      if (def.agencySpecific && !agencyId) {
        return false;
      }

      return true;
    });
  }

  async getSystemReports(): Promise<ReportDefinition[]> {
    return this.definitionRepo.find({
      where: { isSystem: true, status: ReportStatus.ACTIVE },
      order: { category: 'ASC', name: 'ASC' },
    });
  }
}

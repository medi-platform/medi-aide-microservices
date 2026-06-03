import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ContractTemplate, TemplateStatus } from '../entities/contract-template.entity';
import { ContractType } from '../entities/contract.entity';

interface CreateTemplateDto {
  key: string;
  name: string;
  description?: string;
  type: ContractType;
  jurisdiction?: string;
  defaultLocale?: string;
  content: string;
  requiredSignatures: string[];
  placeholders?: ContractTemplate['placeholders'];
  defaultTerms?: Record<string, any>;
}

interface UpdateTemplateDto {
  name?: string;
  description?: string;
  jurisdiction?: string;
  content?: string;
  requiredSignatures?: string[];
  placeholders?: ContractTemplate['placeholders'];
  defaultTerms?: Record<string, any>;
}

interface RenderTemplateOptions {
  patientName?: string;
  caregiverName?: string;
  agencyName?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  currency?: string;
  serviceDescription?: string;
  specialConditions?: string[];
  [key: string]: any;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(ContractTemplate)
    private readonly templateRepo: Repository<ContractTemplate>,
  ) {}

  /**
   * Create a new template
   */
  async createTemplate(
    dto: CreateTemplateDto,
    createdBy?: string,
  ): Promise<ContractTemplate> {
    // Check for duplicate key
    const existing = await this.templateRepo.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Template with key '${dto.key}' already exists`);
    }

    const template = this.templateRepo.create({
      ...dto,
      status: TemplateStatus.DRAFT,
      currentVersion: 1,
      createdBy,
    });

    await this.templateRepo.save(template);

    this.logger.log(`Template created: ${template.id} (${dto.key})`);

    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<ContractTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    return template;
  }

  /**
   * Get template by key
   */
  async getTemplateByKey(key: string): Promise<ContractTemplate> {
    const template = await this.templateRepo.findOne({
      where: { key },
    });

    if (!template) {
      throw new NotFoundException(`Template with key '${key}' not found`);
    }

    return template;
  }

  /**
   * Get all templates
   */
  async getTemplates(options?: {
    type?: ContractType;
    status?: TemplateStatus;
    jurisdiction?: string;
  }): Promise<ContractTemplate[]> {
    const where: any = {};

    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;
    if (options?.jurisdiction) where.jurisdiction = options.jurisdiction;

    return this.templateRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * Get active templates for a type
   */
  async getActiveTemplates(type?: ContractType): Promise<ContractTemplate[]> {
    const where: any = { status: TemplateStatus.ACTIVE };
    if (type) where.type = type;

    return this.templateRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * Update a template (creates new version if published)
   */
  async updateTemplate(
    templateId: string,
    dto: UpdateTemplateDto,
    updatedBy?: string,
  ): Promise<ContractTemplate> {
    const template = await this.getTemplate(templateId);

    // If template is active, create a new version
    if (template.status === TemplateStatus.ACTIVE && dto.content) {
      template.currentVersion += 1;
      this.logger.log(`Template ${templateId} versioned to v${template.currentVersion}`);
    }

    // Apply updates
    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.jurisdiction !== undefined) template.jurisdiction = dto.jurisdiction;
    if (dto.content !== undefined) template.content = dto.content;
    if (dto.requiredSignatures !== undefined) template.requiredSignatures = dto.requiredSignatures;
    if (dto.placeholders !== undefined) template.placeholders = dto.placeholders;
    if (dto.defaultTerms !== undefined) template.defaultTerms = dto.defaultTerms;

    await this.templateRepo.save(template);

    this.logger.log(`Template ${templateId} updated`);

    return template;
  }

  /**
   * Publish a template
   */
  async publishTemplate(
    templateId: string,
    approvedBy: string,
  ): Promise<ContractTemplate> {
    const template = await this.getTemplate(templateId);

    if (template.status === TemplateStatus.ACTIVE) {
      throw new BadRequestException('Template is already published');
    }

    if (template.status === TemplateStatus.ARCHIVED) {
      throw new BadRequestException('Cannot publish an archived template');
    }

    // Validate template content
    this.validateTemplateContent(template);

    template.status = TemplateStatus.ACTIVE;
    template.approvedBy = approvedBy;
    template.approvedAt = new Date();

    await this.templateRepo.save(template);

    this.logger.log(`Template ${templateId} published by ${approvedBy}`);

    return template;
  }

  /**
   * Archive a template
   */
  async archiveTemplate(
    templateId: string,
    archivedBy?: string,
  ): Promise<ContractTemplate> {
    const template = await this.getTemplate(templateId);

    template.status = TemplateStatus.ARCHIVED;
    template.metadata = {
      ...template.metadata,
      archivedAt: new Date(),
      archivedBy,
    };

    await this.templateRepo.save(template);

    this.logger.log(`Template ${templateId} archived`);

    return template;
  }

  /**
   * Deprecate a template
   */
  async deprecateTemplate(
    templateId: string,
    replacementKey?: string,
  ): Promise<ContractTemplate> {
    const template = await this.getTemplate(templateId);

    template.status = TemplateStatus.DEPRECATED;
    template.metadata = {
      ...template.metadata,
      deprecatedAt: new Date(),
      replacementKey,
    };

    await this.templateRepo.save(template);

    this.logger.log(`Template ${templateId} deprecated`);

    return template;
  }

  /**
   * Clone a template
   */
  async cloneTemplate(
    templateId: string,
    newKey: string,
    newName: string,
    createdBy?: string,
  ): Promise<ContractTemplate> {
    const original = await this.getTemplate(templateId);

    // Check for duplicate key
    const existing = await this.templateRepo.findOne({ where: { key: newKey } });
    if (existing) {
      throw new ConflictException(`Template with key '${newKey}' already exists`);
    }

    const clone = this.templateRepo.create({
      key: newKey,
      name: newName,
      description: `Clone of ${original.name}`,
      type: original.type,
      status: TemplateStatus.DRAFT,
      jurisdiction: original.jurisdiction,
      defaultLocale: original.defaultLocale,
      content: original.content,
      requiredSignatures: [...original.requiredSignatures],
      placeholders: original.placeholders ? [...original.placeholders] : undefined,
      defaultTerms: original.defaultTerms ? { ...original.defaultTerms } : undefined,
      currentVersion: 1,
      createdBy,
      metadata: {
        clonedFrom: original.id,
        clonedAt: new Date(),
      },
    });

    await this.templateRepo.save(clone);

    this.logger.log(`Template ${templateId} cloned to ${clone.id} (${newKey})`);

    return clone;
  }

  /**
   * Render a template with data
   */
  async renderTemplate(
    templateId: string,
    data: RenderTemplateOptions,
  ): Promise<string> {
    const template = await this.getTemplate(templateId);

    let content = template.content;

    // Replace placeholders with actual values
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    // Replace date placeholders
    content = content.replace(/{{currentDate}}/g, new Date().toLocaleDateString());
    content = content.replace(/{{currentYear}}/g, String(new Date().getFullYear()));

    // Handle conditional sections
    content = this.processConditionals(content, data);

    // Clean up any remaining placeholders with defaults
    if (template.placeholders) {
      for (const ph of template.placeholders) {
        const placeholder = `{{${ph.name}}}`;
        if (content.includes(placeholder) && ph.defaultValue) {
          content = content.replace(new RegExp(placeholder, 'g'), ph.defaultValue);
        }
      }
    }

    return content;
  }

  /**
   * Get placeholder values from template
   */
  async getPlaceholders(
    templateId: string,
  ): Promise<ContractTemplate['placeholders']> {
    const template = await this.getTemplate(templateId);
    return template.placeholders || [];
  }

  /**
   * Validate template content
   */
  private validateTemplateContent(template: ContractTemplate): void {
    if (!template.content || template.content.trim().length === 0) {
      throw new BadRequestException('Template content cannot be empty');
    }

    if (!template.requiredSignatures || template.requiredSignatures.length === 0) {
      throw new BadRequestException('Template must have at least one required signature');
    }

    // Check for required placeholders
    const requiredPlaceholders = ['patientName', 'caregiverName'];
    for (const placeholder of requiredPlaceholders) {
      if (!template.content.includes(`{{${placeholder}}}`)) {
        this.logger.warn(`Template ${template.id} missing recommended placeholder: ${placeholder}`);
      }
    }
  }

  /**
   * Process conditional sections in template
   */
  private processConditionals(content: string, data: Record<string, any>): string {
    // Handle {{#if condition}}...{{/if}} blocks
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    return content.replace(ifRegex, (_match, condition, block) => {
      return data[condition] ? block : '';
    });
  }
}


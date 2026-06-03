import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate, TemplateCategory, TemplateStatus } from '../entities/message-template.entity';
import { MessageType } from '../interfaces/communication.interface';

interface CreateTemplateDto {
  ownerId?: string;
  isSystem?: boolean;
  name: string;
  description?: string;
  category?: TemplateCategory;
  messageType?: MessageType;
  content: string;
  contentFr?: string;
  placeholders?: MessageTemplate['placeholders'];
  shortcut?: string;
  attachmentTemplates?: MessageTemplate['attachmentTemplates'];
}

interface UpdateTemplateDto {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  content?: string;
  contentFr?: string;
  placeholders?: MessageTemplate['placeholders'];
  shortcut?: string;
  attachmentTemplates?: MessageTemplate['attachmentTemplates'];
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
  ) {}

  async createTemplate(dto: CreateTemplateDto): Promise<MessageTemplate> {
    // Check shortcut uniqueness if provided
    if (dto.shortcut) {
      const existing = await this.templateRepo.findOne({
        where: { shortcut: dto.shortcut, status: TemplateStatus.ACTIVE },
      });
      if (existing) {
        throw new ConflictException(`Shortcut '${dto.shortcut}' is already in use`);
      }
    }

    const template = this.templateRepo.create({
      ...dto,
      category: dto.category || TemplateCategory.GENERAL,
      messageType: dto.messageType || MessageType.TEXT,
      status: TemplateStatus.DRAFT,
    });

    return this.templateRepo.save(template);
  }

  async getTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<MessageTemplate> {
    const template = await this.getTemplate(id);

    if (dto.shortcut && dto.shortcut !== template.shortcut) {
      const existing = await this.templateRepo.findOne({
        where: { shortcut: dto.shortcut, status: TemplateStatus.ACTIVE },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Shortcut '${dto.shortcut}' is already in use`);
      }
    }

    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async publishTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.getTemplate(id);

    if (!template.content) {
      throw new BadRequestException('Template content is required');
    }

    template.status = TemplateStatus.ACTIVE;
    return this.templateRepo.save(template);
  }

  async archiveTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.getTemplate(id);
    template.status = TemplateStatus.ARCHIVED;
    return this.templateRepo.save(template);
  }

  async getUserTemplates(
    userId: string,
    category?: TemplateCategory,
  ): Promise<MessageTemplate[]> {
    const where: any = {
      ownerId: userId,
      status: TemplateStatus.ACTIVE,
    };
    if (category) where.category = category;

    return this.templateRepo.find({
      where,
      order: { usageCount: 'DESC' },
    });
  }

  async getSystemTemplates(category?: TemplateCategory): Promise<MessageTemplate[]> {
    const where: any = {
      isSystem: true,
      status: TemplateStatus.ACTIVE,
    };
    if (category) where.category = category;

    return this.templateRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findByShortcut(shortcut: string): Promise<MessageTemplate | null> {
    return this.templateRepo.findOne({
      where: { shortcut, status: TemplateStatus.ACTIVE },
    });
  }

  async renderTemplate(
    id: string,
    data: Record<string, string>,
    locale: 'en' | 'fr' = 'en',
  ): Promise<string> {
    const template = await this.getTemplate(id);

    let content = locale === 'fr' && template.contentFr ? template.contentFr : template.content;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Fill missing required placeholders with defaults
    if (template.placeholders) {
      for (const ph of template.placeholders) {
        const placeholder = `{{${ph.key}}}`;
        if (content.includes(placeholder) && ph.defaultValue) {
          content = content.replace(new RegExp(placeholder, 'g'), ph.defaultValue);
        }
      }
    }

    return content;
  }

  async useTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.getTemplate(id);
    template.usageCount++;
    template.lastUsedAt = new Date();
    return this.templateRepo.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.getTemplate(id);

    if (template.isSystem) {
      throw new BadRequestException('Cannot delete system templates');
    }

    await this.templateRepo.remove(template);
  }

  async searchTemplates(
    query: string,
    userId?: string,
  ): Promise<MessageTemplate[]> {
    const qb = this.templateRepo.createQueryBuilder('t')
      .where('t.status = :status', { status: TemplateStatus.ACTIVE })
      .andWhere(
        '(t.name ILIKE :query OR t.content ILIKE :query OR t.shortcut ILIKE :query)',
        { query: `%${query}%` },
      );

    if (userId) {
      qb.andWhere('(t.isSystem = true OR t.ownerId = :userId)', { userId });
    } else {
      qb.andWhere('t.isSystem = true');
    }

    return qb.orderBy('t.usageCount', 'DESC').take(20).getMany();
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitTaskTemplate } from '../entities/visit-task-template.entity';

/**
 * Task Template Service
 * Manages reusable visit task templates
 */
@Injectable()
export class TaskTemplateService {
  private readonly logger = new Logger(TaskTemplateService.name);

  constructor(
    @InjectRepository(VisitTaskTemplate)
    private readonly templateRepo: Repository<VisitTaskTemplate>,
  ) {}

  /**
   * Create a task template
   */
  async create(data: Partial<VisitTaskTemplate>): Promise<VisitTaskTemplate> {
    const template = this.templateRepo.create(data);
    return this.templateRepo.save(template);
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<VisitTaskTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Task template ${id} not found`);
    }
    return template;
  }

  /**
   * Get templates by category
   */
  async getByCategory(category: string, agencyId?: string): Promise<VisitTaskTemplate[]> {
    const query = this.templateRepo
      .createQueryBuilder('t')
      .where('t.category = :category', { category })
      .andWhere('t.isActive = true');

    if (agencyId) {
      query.andWhere('(t.agencyId = :agencyId OR t.agencyId IS NULL)', { agencyId });
    } else {
      query.andWhere('t.agencyId IS NULL');
    }

    return query.orderBy('t.sortOrder', 'ASC').getMany();
  }

  /**
   * Get all active templates for an agency
   */
  async getAgencyTemplates(agencyId: string): Promise<VisitTaskTemplate[]> {
    return this.templateRepo.find({
      where: [
        { agencyId, isActive: true },
        { agencyId: undefined, isActive: true },
      ],
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  /**
   * Update a template
   */
  async update(id: string, data: Partial<VisitTaskTemplate>): Promise<VisitTaskTemplate> {
    const template = await this.getById(id);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  /**
   * Deactivate a template
   */
  async deactivate(id: string): Promise<VisitTaskTemplate> {
    const template = await this.getById(id);
    template.isActive = false;
    return this.templateRepo.save(template);
  }

  /**
   * Get task categories
   */
  async getCategories(agencyId?: string): Promise<string[]> {
    const query = this.templateRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.category', 'category')
      .where('t.isActive = true');

    if (agencyId) {
      query.andWhere('(t.agencyId = :agencyId OR t.agencyId IS NULL)', { agencyId });
    }

    const result = await query.getRawMany();
    return result.map((r) => r.category);
  }
}

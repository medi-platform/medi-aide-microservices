/**
 * Task Service
 * Business logic for managing residential tasks
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ShiftTaskInstance } from '../entities/shift-task-instance.entity';
import { ResidenceTaskTemplate } from '../entities/residence-task-template.entity';
import { TaskStatus, TaskPriority, TaskCategory } from '../interfaces/residential.interface';

export interface CreateTaskTemplateDto {
  residence_id?: string;
  name: string;
  description?: string;
  category: TaskCategory;
  default_priority?: TaskPriority;
  estimated_duration_minutes?: number;
  preferred_time?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  requires_certification?: boolean;
  required_certifications?: string[];
  is_regulatory_required?: boolean;
  requires_documentation?: boolean;
  documentation_fields?: any[];
}

export interface CreateTaskInstanceDto {
  shift_id: string;
  template_id?: string;
  resident_id?: string;
  task_name: string;
  description?: string;
  category: TaskCategory;
  priority?: TaskPriority;
  due_time?: Date;
  assigned_to_caregiver_id?: string;
}

export interface UpdateTaskInstanceDto {
  status?: TaskStatus;
  outcome_notes?: string;
  skip_reason?: string;
  defer_reason?: string;
  deferred_to?: Date;
  documentation?: Record<string, any>;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(ShiftTaskInstance)
    private readonly taskInstanceRepository: Repository<ShiftTaskInstance>,
    @InjectRepository(ResidenceTaskTemplate)
    private readonly templateRepository: Repository<ResidenceTaskTemplate>,
  ) {}

  // Template Methods
  async createTemplate(dto: CreateTaskTemplateDto): Promise<ResidenceTaskTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      default_priority: dto.default_priority || TaskPriority.MEDIUM,
      is_active: true,
    });
    return this.templateRepository.save(template);
  }

  async findTemplateById(id: string): Promise<ResidenceTaskTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Task template with ID ${id} not found`);
    }
    return template;
  }

  async updateTemplate(id: string, dto: Partial<CreateTaskTemplateDto>): Promise<ResidenceTaskTemplate> {
    const template = await this.findTemplateById(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async listTemplates(residenceId?: string, category?: TaskCategory): Promise<ResidenceTaskTemplate[]> {
    const qb = this.templateRepository.createQueryBuilder('t');
    qb.where('t.is_active = true');
    
    if (residenceId) {
      qb.andWhere('(t.residence_id = :residenceId OR t.residence_id IS NULL)', { residenceId });
    } else {
      qb.andWhere('t.residence_id IS NULL');
    }

    if (category) {
      qb.andWhere('t.category = :category', { category });
    }

    return qb.orderBy('t.category', 'ASC').addOrderBy('t.name', 'ASC').getMany();
  }

  async deactivateTemplate(id: string): Promise<ResidenceTaskTemplate> {
    const template = await this.findTemplateById(id);
    template.is_active = false;
    return this.templateRepository.save(template);
  }

  // Task Instance Methods
  async createTaskInstance(dto: CreateTaskInstanceDto): Promise<ShiftTaskInstance> {
    const task = this.taskInstanceRepository.create({
      ...dto,
      status: TaskStatus.PENDING,
      priority: dto.priority || TaskPriority.MEDIUM,
    });
    return this.taskInstanceRepository.save(task);
  }

  async createTasksFromTemplates(
    shiftId: string,
    templateIds: string[],
    residentId?: string,
  ): Promise<ShiftTaskInstance[]> {
    const templates = await this.templateRepository.find({
      where: { id: In(templateIds), is_active: true },
    });

    const tasks: ShiftTaskInstance[] = [];
    for (const template of templates) {
      const task = this.taskInstanceRepository.create({
        shift_id: shiftId,
        template_id: template.id,
        resident_id: residentId || template.resident_id,
        task_name: template.name,
        description: template.description,
        category: template.category,
        priority: template.default_priority,
        requires_verification: template.is_regulatory_required,
        status: TaskStatus.PENDING,
      });
      tasks.push(task);
    }

    return this.taskInstanceRepository.save(tasks);
  }

  async findTaskById(id: string): Promise<ShiftTaskInstance> {
    const task = await this.taskInstanceRepository.findOne({
      where: { id },
      relations: ['shift', 'template'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async updateTask(id: string, dto: UpdateTaskInstanceDto): Promise<ShiftTaskInstance> {
    const task = await this.findTaskById(id);
    Object.assign(task, dto);
    return this.taskInstanceRepository.save(task);
  }

  async startTask(id: string, caregiverId: string): Promise<ShiftTaskInstance> {
    const task = await this.findTaskById(id);
    
    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('Can only start pending tasks');
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.started_at = new Date();
    task.assigned_to_caregiver_id = caregiverId;

    return this.taskInstanceRepository.save(task);
  }

  async completeTask(
    id: string,
    caregiverId: string,
    outcomeNotes?: string,
    documentation?: Record<string, any>,
  ): Promise<ShiftTaskInstance> {
    const task = await this.findTaskById(id);

    task.status = TaskStatus.COMPLETED;
    task.completed_at = new Date();
    task.completed_by_caregiver_id = caregiverId;
    if (outcomeNotes) task.outcome_notes = outcomeNotes;
    if (documentation) task.documentation = documentation;

    if (task.started_at) {
      task.actual_duration_minutes = Math.round(
        (task.completed_at.getTime() - task.started_at.getTime()) / 60000
      );
    }

    return this.taskInstanceRepository.save(task);
  }

  async skipTask(id: string, reason: string): Promise<ShiftTaskInstance> {
    const task = await this.findTaskById(id);
    
    task.status = TaskStatus.SKIPPED;
    task.skip_reason = reason;
    task.completed_at = new Date();

    return this.taskInstanceRepository.save(task);
  }

  async deferTask(id: string, reason: string, deferredTo: Date): Promise<ShiftTaskInstance> {
    const task = await this.findTaskById(id);
    
    task.status = TaskStatus.DEFERRED;
    task.defer_reason = reason;
    task.deferred_to = deferredTo;

    return this.taskInstanceRepository.save(task);
  }

  async listTasksByShift(shiftId: string, status?: TaskStatus): Promise<ShiftTaskInstance[]> {
    const query: any = { shift_id: shiftId };
    if (status) {
      query.status = status;
    }
    return this.taskInstanceRepository.find({
      where: query,
      order: { due_time: 'ASC', priority: 'DESC' },
    });
  }

  async listTasksByResident(
    residentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftTaskInstance[]> {
    return this.taskInstanceRepository
      .createQueryBuilder('t')
      .innerJoin('t.shift', 's')
      .where('t.resident_id = :residentId', { residentId })
      .andWhere('s.shift_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('s.shift_date', 'ASC')
      .addOrderBy('t.due_time', 'ASC')
      .getMany();
  }

  async getPendingTasksCount(shiftId: string): Promise<number> {
    return this.taskInstanceRepository.count({
      where: { shift_id: shiftId, status: TaskStatus.PENDING },
    });
  }

  async verifyTask(id: string, verifiedBy: string): Promise<ShiftTaskInstance> {
    const task = await this.findTaskById(id);
    
    if (task.status !== TaskStatus.COMPLETED) {
      throw new BadRequestException('Can only verify completed tasks');
    }

    task.is_verified = true;
    task.verified_by = verifiedBy;
    task.verified_at = new Date();

    return this.taskInstanceRepository.save(task);
  }
}

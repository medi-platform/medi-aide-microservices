import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  ReportSchedule,
  ScheduleFrequency,
  DeliveryMethod,
} from '../entities/report-schedule.entity';
import { ReportDefinitionService } from './report-definition.service';
import { ReportExecutionService } from './report-execution.service';
import { OutputFormat } from '../entities/report-definition.entity';
import { ExecutionTrigger } from '../entities/report-execution.entity';

interface CreateScheduleDto {
  definitionKey: string;
  name: string;
  description?: string;
  agencyId?: string;
  createdBy: string;
  frequency: ScheduleFrequency;
  preferredTime?: string;
  preferredDayOfWeek?: number;
  preferredDayOfMonth?: number;
  timezone?: string;
  format?: OutputFormat;
  parameters?: Record<string, any>;
  dateRangeType?: 'previous_period' | 'last_n_days' | 'fixed';
  dateRangeValue?: number;
  deliveryMethod?: DeliveryMethod;
  deliveryConfig?: ReportSchedule['deliveryConfig'];
  retentionDays?: number;
}

@Injectable()
export class ReportScheduleService {
  private readonly logger = new Logger(ReportScheduleService.name);

  constructor(
    @InjectRepository(ReportSchedule)
    private readonly scheduleRepo: Repository<ReportSchedule>,
    private readonly definitionService: ReportDefinitionService,
    private readonly executionService: ReportExecutionService,
  ) {}

  async createSchedule(dto: CreateScheduleDto): Promise<ReportSchedule> {
    const definition = await this.definitionService.getDefinitionByKey(dto.definitionKey);

    const schedule = this.scheduleRepo.create({
      definitionId: definition.id,
      definitionKey: definition.key,
      name: dto.name,
      description: dto.description,
      agencyId: dto.agencyId,
      createdBy: dto.createdBy,
      frequency: dto.frequency,
      preferredTime: dto.preferredTime || '06:00',
      preferredDayOfWeek: dto.preferredDayOfWeek,
      preferredDayOfMonth: dto.preferredDayOfMonth,
      timezone: dto.timezone || 'America/Toronto',
      format: dto.format || definition.defaultFormat,
      parameters: dto.parameters,
      dateRangeType: dto.dateRangeType || 'previous_period',
      dateRangeValue: dto.dateRangeValue,
      deliveryMethod: dto.deliveryMethod || DeliveryMethod.EMAIL,
      deliveryConfig: dto.deliveryConfig,
      retentionDays: dto.retentionDays || 90,
      isActive: true,
    });

    // Calculate next run
    schedule.nextRunAt = this.calculateNextRun(schedule);

    return this.scheduleRepo.save(schedule);
  }

  async getSchedule(id: string): Promise<ReportSchedule> {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Report schedule ${id} not found`);
    }
    return schedule;
  }

  async updateSchedule(id: string, dto: Partial<CreateScheduleDto>): Promise<ReportSchedule> {
    const schedule = await this.getSchedule(id);

    if (dto.definitionKey && dto.definitionKey !== schedule.definitionKey) {
      const definition = await this.definitionService.getDefinitionByKey(dto.definitionKey);
      schedule.definitionId = definition.id;
      schedule.definitionKey = definition.key;
    }

    Object.assign(schedule, dto);

    // Recalculate next run if schedule changed
    if (dto.frequency || dto.preferredTime || dto.preferredDayOfWeek || dto.preferredDayOfMonth) {
      schedule.nextRunAt = this.calculateNextRun(schedule);
    }

    return this.scheduleRepo.save(schedule);
  }

  async activateSchedule(id: string): Promise<ReportSchedule> {
    const schedule = await this.getSchedule(id);
    schedule.isActive = true;
    schedule.nextRunAt = this.calculateNextRun(schedule);
    return this.scheduleRepo.save(schedule);
  }

  async deactivateSchedule(id: string): Promise<ReportSchedule> {
    const schedule = await this.getSchedule(id);
    schedule.isActive = false;
    schedule.nextRunAt = undefined;
    return this.scheduleRepo.save(schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.getSchedule(id);
    await this.scheduleRepo.remove(schedule);
  }

  async listSchedules(agencyId?: string): Promise<ReportSchedule[]> {
    const where: any = {};
    if (agencyId) where.agencyId = agencyId;

    return this.scheduleRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async getUserSchedules(userId: string): Promise<ReportSchedule[]> {
    return this.scheduleRepo.find({
      where: { createdBy: userId },
      order: { name: 'ASC' },
    });
  }

  async getDueSchedules(): Promise<ReportSchedule[]> {
    return this.scheduleRepo.find({
      where: {
        isActive: true,
        nextRunAt: LessThanOrEqual(new Date()),
      },
    });
  }

  async executeSchedule(id: string): Promise<void> {
    const schedule = await this.getSchedule(id);

    const { dateRangeStart, dateRangeEnd } = this.calculateDateRange(schedule);

    const execution = await this.executionService.generateReport({
      definitionKey: schedule.definitionKey,
      agencyId: schedule.agencyId,
      format: schedule.format,
      parameters: schedule.parameters,
      dateRangeStart,
      dateRangeEnd,
      trigger: ExecutionTrigger.SCHEDULED,
      scheduleId: schedule.id,
    });

    // Update schedule
    schedule.lastRunAt = new Date();
    schedule.lastExecutionId = execution.id;
    schedule.runCount++;
    schedule.nextRunAt = this.calculateNextRun(schedule);

    await this.scheduleRepo.save(schedule);

    this.logger.log(`Scheduled report ${schedule.id} executed, next run at ${schedule.nextRunAt}`);
  }

  async runDueSchedules(): Promise<number> {
    const dueSchedules = await this.getDueSchedules();

    for (const schedule of dueSchedules) {
      try {
        await this.executeSchedule(schedule.id);
        schedule.successCount++;
      } catch (error: any) {
        this.logger.error(`Failed to execute schedule ${schedule.id}: ${error.message}`);
        schedule.failureCount++;
        schedule.nextRunAt = this.calculateNextRun(schedule);
      }
      await this.scheduleRepo.save(schedule);
    }

    return dueSchedules.length;
  }

  private calculateNextRun(schedule: ReportSchedule): Date {
    const now = new Date();
    const [hours, minutes] = schedule.preferredTime.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    // If today's time has passed, start from tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    switch (schedule.frequency) {
      case ScheduleFrequency.DAILY:
        // Already set to next day
        break;
      case ScheduleFrequency.WEEKLY:
        if (schedule.preferredDayOfWeek !== undefined) {
          while (next.getDay() !== schedule.preferredDayOfWeek) {
            next.setDate(next.getDate() + 1);
          }
        }
        break;
      case ScheduleFrequency.BIWEEKLY:
        if (schedule.preferredDayOfWeek !== undefined) {
          while (next.getDay() !== schedule.preferredDayOfWeek) {
            next.setDate(next.getDate() + 1);
          }
          // Add extra week if needed
          if (schedule.runCount % 2 === 1) {
            next.setDate(next.getDate() + 7);
          }
        }
        break;
      case ScheduleFrequency.MONTHLY:
        if (schedule.preferredDayOfMonth) {
          next.setDate(schedule.preferredDayOfMonth);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
        } else {
          next.setMonth(next.getMonth() + 1);
          next.setDate(1);
        }
        break;
      case ScheduleFrequency.QUARTERLY: {
        const currentQuarter = Math.floor(next.getMonth() / 3);
        next.setMonth((currentQuarter + 1) * 3);
        next.setDate(1);
        break;
      }
      case ScheduleFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        next.setMonth(0);
        next.setDate(1);
        break;
    }

    return next;
  }

  private calculateDateRange(schedule: ReportSchedule): { dateRangeStart: Date; dateRangeEnd: Date } {
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    let start: Date;

    switch (schedule.dateRangeType) {
      case 'last_n_days':
        start = new Date(end);
        start.setDate(start.getDate() - (schedule.dateRangeValue || 30));
        break;
      case 'previous_period':
      default:
        start = new Date(end);
        switch (schedule.frequency) {
          case ScheduleFrequency.DAILY:
            start.setDate(start.getDate() - 1);
            break;
          case ScheduleFrequency.WEEKLY:
          case ScheduleFrequency.BIWEEKLY:
            start.setDate(start.getDate() - 7);
            break;
          case ScheduleFrequency.MONTHLY:
            start.setMonth(start.getMonth() - 1);
            break;
          case ScheduleFrequency.QUARTERLY:
            start.setMonth(start.getMonth() - 3);
            break;
          case ScheduleFrequency.YEARLY:
            start.setFullYear(start.getFullYear() - 1);
            break;
        }
        break;
    }

    return { dateRangeStart: start, dateRangeEnd: end };
  }
}

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  ReportExecution,
  ExecutionStatus,
  ExecutionTrigger,
} from '../entities/report-execution.entity';
import { ReportDefinitionService } from './report-definition.service';
import { OutputFormat } from '../entities/report-definition.entity';

interface GenerateReportDto {
  definitionKey: string;
  requestedBy?: string;
  agencyId?: string;
  format?: OutputFormat;
  parameters?: Record<string, any>;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  trigger?: ExecutionTrigger;
  scheduleId?: string;
}

@Injectable()
export class ReportExecutionService {
  private readonly logger = new Logger(ReportExecutionService.name);

  constructor(
    @InjectRepository(ReportExecution)
    private readonly executionRepo: Repository<ReportExecution>,
    private readonly definitionService: ReportDefinitionService,
  ) {}

  async generateReport(dto: GenerateReportDto): Promise<ReportExecution> {
    const definition = await this.definitionService.getDefinitionByKey(dto.definitionKey);

    const format = dto.format || definition.defaultFormat;
    if (!definition.supportedFormats.includes(format)) {
      throw new BadRequestException(
        `Format '${format}' is not supported. Available: ${definition.supportedFormats.join(', ')}`,
      );
    }

    const execution = this.executionRepo.create({
      definitionId: definition.id,
      definitionKey: definition.key,
      requestedBy: dto.requestedBy,
      agencyId: dto.agencyId,
      format,
      parameters: dto.parameters,
      dateRangeStart: dto.dateRangeStart,
      dateRangeEnd: dto.dateRangeEnd,
      trigger: dto.trigger || ExecutionTrigger.MANUAL,
      scheduleId: dto.scheduleId,
      status: ExecutionStatus.PENDING,
    });

    const saved = await this.executionRepo.save(execution);

    // Queue the report generation (would use message queue in production)
    this.processReportAsync(saved.id);

    this.logger.log(`Report execution ${saved.id} created for ${dto.definitionKey}`);

    return saved;
  }

  async getExecution(id: string): Promise<ReportExecution> {
    const execution = await this.executionRepo.findOne({ where: { id } });
    if (!execution) {
      throw new NotFoundException(`Report execution ${id} not found`);
    }
    return execution;
  }

  async cancelExecution(id: string): Promise<ReportExecution> {
    const execution = await this.getExecution(id);

    if (execution.status === ExecutionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed execution');
    }

    execution.status = ExecutionStatus.CANCELLED;
    return this.executionRepo.save(execution);
  }

  async retryExecution(id: string): Promise<ReportExecution> {
    const original = await this.getExecution(id);

    if (original.status !== ExecutionStatus.FAILED) {
      throw new BadRequestException('Can only retry failed executions');
    }

    if (original.retryCount >= original.maxRetries) {
      throw new BadRequestException('Maximum retry attempts reached');
    }

    original.status = ExecutionStatus.PENDING;
    original.retryCount++;
    original.errorMessage = undefined;
    original.errorDetails = undefined;

    const saved = await this.executionRepo.save(original);

    this.processReportAsync(saved.id);

    return saved;
  }

  async getUserExecutions(
    userId: string,
    limit: number = 50,
  ): Promise<ReportExecution[]> {
    return this.executionRepo.find({
      where: { requestedBy: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getScheduleExecutions(scheduleId: string, limit: number = 20): Promise<ReportExecution[]> {
    return this.executionRepo.find({
      where: { scheduleId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async cleanupExpiredReports(): Promise<number> {
    const result = await this.executionRepo.update(
      {
        status: ExecutionStatus.COMPLETED,
        expiresAt: LessThan(new Date()),
        fileUrl: undefined, // Already has a file URL
      },
      { fileUrl: undefined }, // Clear the URL
    );

    return result.affected || 0;
  }

  async getExecutionStats(
    agencyId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    byStatus: Record<ExecutionStatus, number>;
    byDefinition: { key: string; count: number }[];
    avgDurationMs: number;
  }> {
    const qb = this.executionRepo.createQueryBuilder('e');

    if (agencyId) qb.where('e.agency_id = :agencyId', { agencyId });
    if (startDate) qb.andWhere('e.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('e.created_at <= :endDate', { endDate });

    const executions = await qb.getMany();

    const byStatus: Record<string, number> = {};
    const byDefinition: Record<string, number> = {};
    let totalDuration = 0;
    let countWithDuration = 0;

    for (const e of executions) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      byDefinition[e.definitionKey] = (byDefinition[e.definitionKey] || 0) + 1;
      if (e.durationMs) {
        totalDuration += e.durationMs;
        countWithDuration++;
      }
    }

    return {
      total: executions.length,
      byStatus: byStatus as Record<ExecutionStatus, number>,
      byDefinition: Object.entries(byDefinition)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count),
      avgDurationMs: countWithDuration > 0 ? Math.round(totalDuration / countWithDuration) : 0,
    };
  }

  // Simulated async processing (would use message queue in production)
  private async processReportAsync(executionId: string): Promise<void> {
    setTimeout(async () => {
      try {
        const execution = await this.executionRepo.findOne({ where: { id: executionId } });
        if (!execution || execution.status !== ExecutionStatus.PENDING) return;

        execution.status = ExecutionStatus.RUNNING;
        execution.startedAt = new Date();
        await this.executionRepo.save(execution);

        // Simulate report generation (2-5 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        execution.status = ExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
        execution.durationMs = execution.completedAt.getTime() - execution.startedAt!.getTime();
        execution.fileUrl = `/reports/download/${executionId}`;
        execution.fileName = `report_${execution.definitionKey}_${Date.now()}.${execution.format}`;
        execution.fileSizeBytes = Math.floor(Math.random() * 1000000);
        execution.rowCount = Math.floor(Math.random() * 1000);
        execution.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await this.executionRepo.save(execution);

        this.logger.log(`Report execution ${executionId} completed`);
      } catch (error: any) {
        const execution = await this.executionRepo.findOne({ where: { id: executionId } });
        if (execution) {
          execution.status = ExecutionStatus.FAILED;
          execution.completedAt = new Date();
          execution.errorMessage = error.message;
          await this.executionRepo.save(execution);
        }
      }
    }, 100);
  }
}

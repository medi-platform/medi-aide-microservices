import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportExecutionService } from '../services/report-execution.service';
import { OutputFormat } from '../entities/report-definition.entity';

/**
 * Report Execution Controller
 * Phase 5H: Generate and manage report executions
 */
@ApiTags('Report Executions')
@Controller('executions')
export class ExecutionController {
  constructor(private readonly executionService: ReportExecutionService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report' })
  @ApiResponse({ status: 201, description: 'Report generation started' })
  async generateReport(@Body() dto: {
    definitionKey: string;
    requestedBy?: string;
    agencyId?: string;
    format?: OutputFormat;
    parameters?: Record<string, any>;
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
  }) {
    return this.executionService.generateReport(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get execution status' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  async getExecution(@Param('id', ParseUUIDPipe) id: string) {
    return this.executionService.getExecution(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending execution' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  async cancelExecution(@Param('id', ParseUUIDPipe) id: string) {
    return this.executionService.cancelExecution(id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed execution' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  async retryExecution(@Param('id', ParseUUIDPipe) id: string) {
    return this.executionService.retryExecution(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user report executions' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  async getUserExecutions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.executionService.getUserExecutions(userId, limit);
  }

  @Get('schedule/:scheduleId')
  @ApiOperation({ summary: 'Get schedule execution history' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  @ApiQuery({ name: 'limit', required: false })
  async getScheduleExecutions(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Query('limit') limit?: number,
  ) {
    return this.executionService.getScheduleExecutions(scheduleId, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get execution statistics' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getExecutionStats(
    @Query('agencyId') agencyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.executionService.getExecutionStats(
      agencyId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

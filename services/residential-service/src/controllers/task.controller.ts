/**
 * Task Controller
 * REST API endpoints for residential task management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  TaskService,
  CreateTaskTemplateDto,
  CreateTaskInstanceDto,
  UpdateTaskInstanceDto,
} from '../services/task.service';
import { TaskStatus, TaskCategory } from '../interfaces/residential.interface';

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // Template Endpoints
  @Post('templates')
  @ApiOperation({ summary: 'Create task template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() dto: CreateTaskTemplateDto) {
    return this.taskService.createTemplate(dto);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get task template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  async findTemplateById(@Param('id') id: string) {
    return this.taskService.findTemplateById(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update task template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateTaskTemplateDto>) {
    return this.taskService.updateTemplate(id, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List task templates' })
  @ApiQuery({ name: 'residenceId', required: false })
  @ApiQuery({ name: 'category', required: false, enum: TaskCategory })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async listTemplates(
    @Query('residenceId') residenceId?: string,
    @Query('category') category?: TaskCategory,
  ) {
    return this.taskService.listTemplates(residenceId, category);
  }

  @Post('templates/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate task template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template deactivated' })
  async deactivateTemplate(@Param('id') id: string) {
    return this.taskService.deactivateTemplate(id);
  }

  // Task Instance Endpoints
  @Post()
  @ApiOperation({ summary: 'Create task instance' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTaskInstance(@Body() dto: CreateTaskInstanceDto) {
    return this.taskService.createTaskInstance(dto);
  }

  @Post('from-templates')
  @ApiOperation({ summary: 'Create tasks from templates' })
  @ApiResponse({ status: 201, description: 'Tasks created from templates' })
  async createFromTemplates(
    @Body()
    body: {
      shiftId: string;
      templateIds: string[];
      residentId?: string;
    },
  ) {
    return this.taskService.createTasksFromTemplates(
      body.shiftId,
      body.templateIds,
      body.residentId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async findTaskById(@Param('id') id: string) {
    return this.taskService.findTaskById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskInstanceDto) {
    return this.taskService.updateTask(id, dto);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task started' })
  async startTask(@Param('id') id: string, @Body() body: { caregiverId: string }) {
    return this.taskService.startTask(id, body.caregiverId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task completed' })
  async completeTask(
    @Param('id') id: string,
    @Body()
    body: {
      caregiverId: string;
      outcomeNotes?: string;
      documentation?: Record<string, any>;
    },
  ) {
    return this.taskService.completeTask(id, body.caregiverId, body.outcomeNotes, body.documentation);
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task skipped' })
  async skipTask(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.taskService.skipTask(id, body.reason);
  }

  @Post(':id/defer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Defer task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deferred' })
  async deferTask(
    @Param('id') id: string,
    @Body() body: { reason: string; deferredTo: Date },
  ) {
    return this.taskService.deferTask(id, body.reason, new Date(body.deferredTo));
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify completed task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task verified' })
  async verifyTask(@Param('id') id: string, @Body() body: { verifiedBy: string }) {
    return this.taskService.verifyTask(id, body.verifiedBy);
  }

  @Get('shift/:shiftId')
  @ApiOperation({ summary: 'List tasks by shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async listByShift(
    @Param('shiftId') shiftId: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.taskService.listTasksByShift(shiftId, status);
  }

  @Get('resident/:residentId')
  @ApiOperation({ summary: 'List tasks by resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async listByResident(
    @Param('residentId') residentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.taskService.listTasksByResident(residentId, new Date(startDate), new Date(endDate));
  }

  @Get('shift/:shiftId/pending-count')
  @ApiOperation({ summary: 'Get pending tasks count for shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Pending tasks count' })
  async getPendingCount(@Param('shiftId') shiftId: string) {
    const count = await this.taskService.getPendingTasksCount(shiftId);
    return { count };
  }
}

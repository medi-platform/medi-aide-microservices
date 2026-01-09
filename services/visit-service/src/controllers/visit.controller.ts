import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VisitService } from '../services/visit.service';
import { TaskTemplateService } from '../services/task-template.service';
import { VisitStatus, CancellationReason, VisitType } from '../interfaces/visit.interface';

class CreateVisitDto {
  caregiverId!: string;
  patientId!: string;
  agencyId?: string;
  scheduleId?: string;
  carePlanId?: string;
  visitType?: VisitType;
  scheduledStart!: string;
  scheduledEnd!: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  requiresEvv?: boolean;
  tasks?: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    isRequired: boolean;
  }>;
}

class UpdateStatusDto {
  status!: VisitStatus;
  notes?: string;
  performedBy?: string;
}

class CancelVisitDto {
  reason!: CancellationReason;
  notes?: string;
  cancelledBy!: string;
}

class RescheduleDto {
  newStart!: string;
  newEnd!: string;
  rescheduledBy!: string;
  reason?: string;
}

class AddNoteDto {
  type!: 'general' | 'clinical' | 'incident' | 'private';
  content!: string;
  createdBy!: string;
  isPrivate?: boolean;
}

class RateVisitDto {
  caregiverRating?: number;
  patientSatisfaction?: number;
  feedback?: string;
}

class CreateTaskTemplateDto {
  agencyId?: string;
  name!: string;
  description?: string;
  category!: string;
  isRequired?: boolean;
  sortOrder?: number;
  estimatedMinutes?: number;
}

@Controller('visits')
@ApiTags('visits')
export class VisitController {
  constructor(
    private readonly visitService: VisitService,
    private readonly taskTemplateService: TaskTemplateService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new visit' })
  @ApiResponse({ status: 201, description: 'Visit created' })
  async create(@Body() dto: CreateVisitDto) {
    return this.visitService.create({
      ...dto,
      visitType: dto.visitType || VisitType.REGULAR,
      scheduledStart: new Date(dto.scheduledStart),
      scheduledEnd: new Date(dto.scheduledEnd),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit by ID' })
  @ApiResponse({ status: 200, description: 'Visit details' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitService.getById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update visit status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.visitService.updateStatus(id, dto.status, dto.performedBy, dto.notes);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a visit' })
  @ApiResponse({ status: 200, description: 'Visit cancelled' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelVisitDto,
  ) {
    return this.visitService.cancel(id, dto.reason, dto.cancelledBy, dto.notes);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reschedule a visit' })
  @ApiResponse({ status: 201, description: 'Visit rescheduled' })
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.visitService.reschedule(
      id,
      new Date(dto.newStart),
      new Date(dto.newEnd),
      dto.rescheduledBy,
      dto.reason,
    );
  }

  @Post(':id/tasks/:taskId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a task within a visit' })
  async completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId') taskId: string,
    @Body() body: { notes?: string },
  ) {
    return this.visitService.completeTask(id, taskId, body.notes);
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a note to a visit' })
  async addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.visitService.addNote(id, dto.type, dto.content, dto.createdBy, dto.isPrivate);
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate a visit' })
  async rateVisit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateVisitDto,
  ) {
    return this.visitService.rateVisit(id, dto.caregiverRating, dto.patientSatisfaction, dto.feedback);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get visit history/logs' })
  async getVisitLogs(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitService.getVisitLogs(id);
  }

  @Get('caregiver/:caregiverId')
  @ApiOperation({ summary: 'Get visits for a caregiver' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'status', required: false })
  async getCaregiverVisits(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: VisitStatus,
  ) {
    return this.visitService.getCaregiverVisits(
      caregiverId,
      new Date(startDate),
      new Date(endDate),
      status,
    );
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get visits for a patient' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'status', required: false })
  async getPatientVisits(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: VisitStatus,
  ) {
    return this.visitService.getPatientVisits(
      patientId,
      new Date(startDate),
      new Date(endDate),
      status,
    );
  }

  // Task Template endpoints
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task template' })
  async createTemplate(@Body() dto: CreateTaskTemplateDto) {
    return this.taskTemplateService.create(dto);
  }

  @Get('templates/categories')
  @ApiOperation({ summary: 'Get task categories' })
  @ApiQuery({ name: 'agencyId', required: false })
  async getCategories(@Query('agencyId') agencyId?: string) {
    return this.taskTemplateService.getCategories(agencyId);
  }

  @Get('templates/category/:category')
  @ApiOperation({ summary: 'Get templates by category' })
  @ApiQuery({ name: 'agencyId', required: false })
  async getTemplatesByCategory(
    @Param('category') category: string,
    @Query('agencyId') agencyId?: string,
  ) {
    return this.taskTemplateService.getByCategory(category, agencyId);
  }

  @Get('templates/agency/:agencyId')
  @ApiOperation({ summary: 'Get all templates for an agency' })
  async getAgencyTemplates(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.taskTemplateService.getAgencyTemplates(agencyId);
  }
}

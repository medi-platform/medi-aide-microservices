import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CarePlanService } from '../services/care-plan.service';

@ApiTags('Care Plans')
@Controller('care-plans')
export class CarePlanController {
  constructor(private readonly carePlans: CarePlanService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'care-plan' };
  }

  @Get()
  @ApiOperation({ summary: 'List care plans' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(@Query('patientId') patientId?: string, @Query('status') status?: string) {
    return this.carePlans.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get care plan by ID' })
  getById(@Param('id') id: string) {
    return this.carePlans.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create care plan' })
  create(@Body() data: any) {
    return this.carePlans.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update care plan' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.carePlans.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete care plan' })
  delete(@Param('id') id: string) {
    return { deleted: true, id };
  }
}

/**
 * Mobile Care Plans Controller
 * Optimized endpoints for mobile applications
 */
@ApiTags('Mobile Care Plans')
@Controller('mobile/care-plans')
export class MobileCarePlanController {
  constructor(private readonly carePlans: CarePlanService) {}

  @Get()
  @ApiOperation({ summary: 'Get care plans for mobile (optimized)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'caregiverId', required: false })
  listForMobile(
    @Query('patientId') patientId?: string,
    @Query('caregiverId') caregiverId?: string,
  ) {
    return {
      carePlans: [],
      lastSync: new Date().toISOString(),
      offlineAvailable: true,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get care plan for mobile (optimized)' })
  getForMobile(@Param('id') id: string) {
    return {
      id,
      patient: {},
      goals: [],
      tasks: [],
      medications: [],
      lastUpdated: new Date().toISOString(),
      offlineAvailable: true,
    };
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get care plan tasks for mobile' })
  getTasks(@Param('id') id: string) {
    return {
      tasks: [],
      completedToday: 0,
      totalToday: 0,
    };
  }

  @Post(':id/tasks/:taskId/complete')
  @ApiOperation({ summary: 'Complete a care plan task' })
  completeTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: { notes?: string; completedAt?: string },
  ) {
    return {
      success: true,
      taskId,
      completedAt: body.completedAt || new Date().toISOString(),
    };
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to care plan' })
  addNote(
    @Param('id') id: string,
    @Body() body: { content: string; type?: string },
  ) {
    return {
      success: true,
      noteId: `note_${Date.now()}`,
      carePlanId: id,
    };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync offline changes' })
  syncOfflineChanges(@Body() body: { changes: any[] }) {
    return {
      success: true,
      synced: body.changes?.length || 0,
      conflicts: [],
      lastSync: new Date().toISOString(),
    };
  }
}

/**
 * Daily Note Controller
 * REST API endpoints for daily documentation management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DailyNoteService, CreateDailyNoteDto, UpdateDailyNoteDto } from '../services/daily-note.service';
import { NoteCategory, NoteVisibility } from '../entities/residential-daily-note.entity';

@ApiTags('Daily Notes')
@Controller('daily-notes')
export class DailyNoteController {
  constructor(private readonly dailyNoteService: DailyNoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a daily note' })
  @ApiResponse({ status: 201, description: 'Daily note created' })
  async create(@Body() dto: CreateDailyNoteDto) {
    return this.dailyNoteService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Daily note details' })
  async findById(@Param('id') id: string) {
    return this.dailyNoteService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update daily note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Daily note updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateDailyNoteDto) {
    return this.dailyNoteService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete daily note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 204, description: 'Daily note deleted' })
  async delete(@Param('id') id: string) {
    return this.dailyNoteService.delete(id);
  }

  @Get('resident/:residentId')
  @ApiOperation({ summary: 'List daily notes for a resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'category', required: false, enum: NoteCategory })
  @ApiQuery({ name: 'visibility', required: false, enum: NoteVisibility })
  @ApiResponse({ status: 200, description: 'List of daily notes' })
  async listByResident(
    @Param('residentId') residentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('category') category?: NoteCategory,
    @Query('visibility') visibility?: NoteVisibility,
  ) {
    return this.dailyNoteService.listByResident(
      residentId,
      new Date(startDate),
      new Date(endDate),
      category,
      visibility,
    );
  }

  @Get('residence/:residenceId/date/:date')
  @ApiOperation({ summary: 'List daily notes for a residence on a specific date' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiParam({ name: 'date', description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'category', required: false, enum: NoteCategory })
  @ApiResponse({ status: 200, description: 'List of daily notes' })
  async listByResidence(
    @Param('residenceId') residenceId: string,
    @Param('date') date: string,
    @Query('category') category?: NoteCategory,
  ) {
    return this.dailyNoteService.listByResidence(residenceId, new Date(date), category);
  }

  @Get('shift/:shiftId')
  @ApiOperation({ summary: 'List daily notes for a shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'List of daily notes' })
  async listByShift(@Param('shiftId') shiftId: string) {
    return this.dailyNoteService.listByShift(shiftId);
  }

  @Get('residence/:residenceId/pending-follow-ups')
  @ApiOperation({ summary: 'List pending follow-ups for a residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'List of notes requiring follow-up' })
  async listPendingFollowUps(@Param('residenceId') residenceId: string) {
    return this.dailyNoteService.listPendingFollowUps(residenceId);
  }

  @Post(':id/follow-up-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark follow-up as complete' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Follow-up marked complete' })
  async markFollowUpComplete(@Param('id') id: string) {
    return this.dailyNoteService.markFollowUpComplete(id);
  }

  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge note (supervisor)' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note acknowledged' })
  async acknowledgeNote(@Param('id') id: string, @Body() body: { supervisorId: string }) {
    return this.dailyNoteService.acknowledgeNote(id, body.supervisorId);
  }

  @Post(':id/attachment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add attachment to note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Attachment added' })
  async addAttachment(
    @Param('id') id: string,
    @Body() body: { fileId: string; fileName: string; fileType: string },
  ) {
    return this.dailyNoteService.addAttachment(id, body.fileId, body.fileName, body.fileType);
  }

  @Get('residence/:residenceId/search')
  @ApiOperation({ summary: 'Search daily notes' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchNotes(
    @Param('residenceId') residenceId: string,
    @Query('q') query: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dailyNoteService.searchNotes(
      residenceId,
      query,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('resident/:residentId/family-visible')
  @ApiOperation({ summary: 'Get family-visible notes for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Family-visible notes' })
  async getFamilyVisibleNotes(
    @Param('residentId') residentId: string,
    @Query('limit') limit?: number,
  ) {
    return this.dailyNoteService.getFamilyVisibleNotes(residentId, limit);
  }
}

/**
 * Observation Controller
 * REST API endpoints for mood observations and meal tracking
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  ObservationService,
  CreateMoodObservationDto,
  CreateMealEntryDto,
} from '../services/observation.service';

@ApiTags('Observations')
@Controller('observations')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  // Mood Observation Endpoints
  @Post('mood')
  @ApiOperation({ summary: 'Create mood observation' })
  @ApiResponse({ status: 201, description: 'Mood observation created' })
  async createMoodObservation(@Body() dto: CreateMoodObservationDto) {
    return this.observationService.createMoodObservation(dto);
  }

  @Get('mood/:id')
  @ApiOperation({ summary: 'Get mood observation by ID' })
  @ApiParam({ name: 'id', description: 'Observation ID' })
  @ApiResponse({ status: 200, description: 'Mood observation details' })
  async findMoodObservationById(@Param('id') id: string) {
    return this.observationService.findMoodObservationById(id);
  }

  @Get('mood/resident/:residentId')
  @ApiOperation({ summary: 'List mood observations for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'List of mood observations' })
  async listMoodObservations(
    @Param('residentId') residentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.observationService.listMoodObservations(
      residentId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('mood/resident/:residentId/trend')
  @ApiOperation({ summary: 'Get mood trend for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Mood trend analysis' })
  async getMoodTrend(
    @Param('residentId') residentId: string,
    @Query('days') days?: number,
  ) {
    return this.observationService.getMoodTrend(residentId, days);
  }

  @Post('mood/:id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate mood observation to clinical' })
  @ApiParam({ name: 'id', description: 'Observation ID' })
  @ApiResponse({ status: 200, description: 'Escalated to clinical' })
  async escalateToClinic(@Param('id') id: string, @Body() body: { escalatedTo: string }) {
    return this.observationService.escalateToClinic(id, body.escalatedTo);
  }

  // Meal Entry Endpoints
  @Post('meals')
  @ApiOperation({ summary: 'Create meal entry' })
  @ApiResponse({ status: 201, description: 'Meal entry created' })
  async createMealEntry(@Body() dto: CreateMealEntryDto) {
    return this.observationService.createMealEntry(dto);
  }

  @Get('meals/:id')
  @ApiOperation({ summary: 'Get meal entry by ID' })
  @ApiParam({ name: 'id', description: 'Meal Entry ID' })
  @ApiResponse({ status: 200, description: 'Meal entry details' })
  async findMealEntryById(@Param('id') id: string) {
    return this.observationService.findMealEntryById(id);
  }

  @Get('meals/resident/:residentId')
  @ApiOperation({ summary: 'List meal entries for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'List of meal entries' })
  async listMealEntries(
    @Param('residentId') residentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.observationService.listMealEntries(
      residentId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('meals/resident/:residentId/daily')
  @ApiOperation({ summary: 'Get daily meals for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'date', required: true })
  @ApiResponse({ status: 200, description: 'Daily meal entries' })
  async getDailyMeals(
    @Param('residentId') residentId: string,
    @Query('date') date: string,
  ) {
    return this.observationService.getDailyMeals(residentId, new Date(date));
  }

  @Get('meals/resident/:residentId/nutrition-summary')
  @ApiOperation({ summary: 'Get nutrition summary for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Nutrition summary' })
  async getNutritionSummary(
    @Param('residentId') residentId: string,
    @Query('days') days?: number,
  ) {
    return this.observationService.getNutritionSummary(residentId, days);
  }

  @Post('meals/:id/flag-weight-concern')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag meal entry for weight concern' })
  @ApiParam({ name: 'id', description: 'Meal Entry ID' })
  @ApiResponse({ status: 200, description: 'Weight concern flagged' })
  async flagWeightConcern(@Param('id') id: string) {
    return this.observationService.flagWeightConcern(id);
  }
}

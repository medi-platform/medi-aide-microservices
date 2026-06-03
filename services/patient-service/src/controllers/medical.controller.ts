import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MedicalService } from '../services/medical.service';

@Controller('patients/:patientId/medical')
@ApiTags('medical')
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get() @ApiOperation({ summary: 'Get medical records' })
  findAll(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.medicalService.findAll(patientId); }

  @Post() @ApiOperation({ summary: 'Add medical record' })
  create(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: any) { return this.medicalService.create(patientId, dto); }

  @Get('conditions') @ApiOperation({ summary: 'Get conditions' })
  getConditions(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.medicalService.getConditions(patientId); }

  @Get('vitals') @ApiOperation({ summary: 'Get vital signs history' })
  getVitals(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.medicalService.getVitals(patientId); }

  @Post('vitals') @ApiOperation({ summary: 'Record vital signs' })
  recordVitals(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: any) { return this.medicalService.recordVitals(patientId, dto); }
}



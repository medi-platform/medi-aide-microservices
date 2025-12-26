import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PatientService } from '../services/patient.service';

@Controller('patients')
@ApiTags('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post() @ApiOperation({ summary: 'Create patient' })
  create(@Body() dto: any) { return this.patientService.create(dto); }

  @Get() @ApiOperation({ summary: 'List patients' })
  findAll(@Query() query: any) { return this.patientService.findAll(query); }

  @Get('search') @ApiOperation({ summary: 'Search patients' })
  search(@Query('q') q: string) { return this.patientService.search(q); }

  @Get(':id') @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.patientService.findById(id); }

  @Put(':id') @ApiOperation({ summary: 'Update patient' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.patientService.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete patient' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.patientService.remove(id); }

  @Get(':id/care-history') @ApiOperation({ summary: 'Get care history' })
  getCareHistory(@Param('id', ParseUUIDPipe) id: string) { return this.patientService.getCareHistory(id); }

  @Get(':id/medications') @ApiOperation({ summary: 'Get medications' })
  getMedications(@Param('id', ParseUUIDPipe) id: string) { return this.patientService.getMedications(id); }

  @Get(':id/allergies') @ApiOperation({ summary: 'Get allergies' })
  getAllergies(@Param('id', ParseUUIDPipe) id: string) { return this.patientService.getAllergies(id); }

  @Get(':id/preferences') @ApiOperation({ summary: 'Get care preferences' })
  getPreferences(@Param('id', ParseUUIDPipe) id: string) { return this.patientService.getPreferences(id); }

  @Put(':id/preferences') @ApiOperation({ summary: 'Update care preferences' })
  updatePreferences(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.patientService.updatePreferences(id, dto); }
}


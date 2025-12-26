import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FamilyService } from '../services/family.service';

@Controller('patients/:patientId/family')
@ApiTags('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get() @ApiOperation({ summary: 'Get family members' })
  findAll(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.familyService.findAll(patientId); }

  @Post() @ApiOperation({ summary: 'Add family member' })
  create(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: any) { return this.familyService.create(patientId, dto); }

  @Put(':memberId') @ApiOperation({ summary: 'Update family member' })
  update(@Param('patientId', ParseUUIDPipe) patientId: string, @Param('memberId', ParseUUIDPipe) memberId: string, @Body() dto: any) { return this.familyService.update(patientId, memberId, dto); }

  @Delete(':memberId') @ApiOperation({ summary: 'Remove family member' })
  remove(@Param('patientId', ParseUUIDPipe) patientId: string, @Param('memberId', ParseUUIDPipe) memberId: string) { return this.familyService.remove(patientId, memberId); }

  @Get('emergency-contacts') @ApiOperation({ summary: 'Get emergency contacts' })
  getEmergencyContacts(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.familyService.getEmergencyContacts(patientId); }
}


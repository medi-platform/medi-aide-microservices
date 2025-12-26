import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InsuranceService } from '../services/insurance.service';

@Controller('insurance')
@ApiTags('insurance')
export class InsuranceController {
  constructor(private readonly service: InsuranceService) {}

  @Get('policies') @ApiOperation({ summary: 'List policies' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Post('policies') @ApiOperation({ summary: 'Create policy' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get('policies/:id') @ApiOperation({ summary: 'Get policy' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Put('policies/:id') @ApiOperation({ summary: 'Update policy' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete('policies/:id') @ApiOperation({ summary: 'Delete policy' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }

  @Post('verify') @ApiOperation({ summary: 'Verify insurance' })
  verify(@Body() dto: any) { return this.service.verify(dto); }

  @Get('patient/:patientId') @ApiOperation({ summary: 'Get patient insurance' })
  getPatientInsurance(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.service.getPatientInsurance(patientId); }

  @Get('eligibility/:policyId') @ApiOperation({ summary: 'Check eligibility' })
  checkEligibility(@Param('policyId', ParseUUIDPipe) policyId: string) { return this.service.checkEligibility(policyId); }
}



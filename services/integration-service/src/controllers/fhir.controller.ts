import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * FHIR Controller
 * HL7 FHIR R4 integration for healthcare interoperability.
 */
@ApiTags('FHIR')
@Controller('fhir')
export class FhirController {

  @Get('Patient/:id')
  @ApiOperation({ summary: 'Get FHIR Patient resource' })
  async getPatient(@Param('id') id: string) {
    return {
      resourceType: 'Patient',
      id,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
    };
  }

  @Get('Patient')
  @ApiOperation({ summary: 'Search FHIR Patients' })
  async searchPatients(@Query() query: any) {
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };
  }

  @Post('Patient')
  @ApiOperation({ summary: 'Create FHIR Patient' })
  async createPatient(@Body() dto: any) {
    return { resourceType: 'Patient', id: `pat_${Date.now()}`, ...dto };
  }

  @Get('Practitioner/:id')
  @ApiOperation({ summary: 'Get FHIR Practitioner resource' })
  async getPractitioner(@Param('id') id: string) {
    return { resourceType: 'Practitioner', id };
  }

  @Get('Observation/:id')
  @ApiOperation({ summary: 'Get FHIR Observation resource' })
  async getObservation(@Param('id') id: string) {
    return { resourceType: 'Observation', id };
  }

  @Get('CarePlan/:id')
  @ApiOperation({ summary: 'Get FHIR CarePlan resource' })
  async getCarePlan(@Param('id') id: string) {
    return { resourceType: 'CarePlan', id };
  }

  @Post('$convert')
  @ApiOperation({ summary: 'Convert internal data to FHIR' })
  async convertToFhir(@Body() dto: { entityType: string; entityId: string }) {
    return { converted: true, resourceType: dto.entityType, id: dto.entityId };
  }

  @Get('metadata')
  @ApiOperation({ summary: 'FHIR Capability Statement' })
  async getCapabilityStatement() {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      fhirVersion: '4.0.1',
      format: ['json', 'xml'],
    };
  }
}


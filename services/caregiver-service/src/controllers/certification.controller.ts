import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CertificationService } from '../services/certification.service';

@Controller('caregivers/:caregiverId/certifications')
@ApiTags('certifications')
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get caregiver certifications' })
  @ApiQuery({ name: 'status', required: false })
  async getCertifications(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: string
  ) {
    return this.certificationService.getCertifications(caregiverId, status);
  }

  @Post()
  @ApiOperation({ summary: 'Add certification' })
  async addCertification(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: any
  ) {
    return this.certificationService.addCertification(caregiverId, dto);
  }

  @Get(':certId')
  @ApiOperation({ summary: 'Get certification details' })
  async getCertification(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('certId', ParseUUIDPipe) certId: string
  ) {
    return this.certificationService.getCertification(caregiverId, certId);
  }

  @Put(':certId')
  @ApiOperation({ summary: 'Update certification' })
  async updateCertification(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('certId', ParseUUIDPipe) certId: string,
    @Body() dto: any
  ) {
    return this.certificationService.updateCertification(caregiverId, certId, dto);
  }

  @Delete(':certId')
  @ApiOperation({ summary: 'Remove certification' })
  async removeCertification(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('certId', ParseUUIDPipe) certId: string
  ) {
    return this.certificationService.removeCertification(caregiverId, certId);
  }

  @Patch(':certId/verify')
  @ApiOperation({ summary: 'Verify certification' })
  async verifyCertification(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('certId', ParseUUIDPipe) certId: string,
    @Body() dto: any
  ) {
    return this.certificationService.verifyCertification(caregiverId, certId, dto);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring certifications' })
  async getExpiring(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('days') days: number = 30
  ) {
    return this.certificationService.getExpiring(caregiverId, days);
  }

  @Get('required')
  @ApiOperation({ summary: 'Get required certifications status' })
  async getRequiredStatus(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.certificationService.getRequiredStatus(caregiverId);
  }
}


import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AgencyContractService } from '../services/agency-contract.service';
import { AgencyContractStatus, AgencyContractType, AgencyContract } from '../entities/agency-contract.entity';

/**
 * Agency Contract Controller
 * 
 * Phase 5E: B2B agency contracts management
 * Includes SLAs, volume discounts, and partnership terms
 */
@ApiTags('Agency Contracts')
@Controller('agency-contracts')
export class AgencyContractController {
  constructor(private readonly agencyContractService: AgencyContractService) {}

  @Post()
  @ApiOperation({ summary: 'Create an agency contract' })
  @ApiResponse({ status: 201, description: 'Agency contract created successfully' })
  async createAgencyContract(@Body() dto: {
    agencyId: string;
    agencyName: string;
    type: AgencyContractType;
    title: string;
    description?: string;
    effectiveDate: Date;
    expirationDate: Date;
    autoRenew?: boolean;
    renewalNoticeDays?: number;
    baseFee?: number;
    platformFeePercentage?: number;
    volumeDiscountTiers?: AgencyContract['volumeDiscountTiers'];
    paymentTermsDays?: number;
    currency?: string;
    slaTerms?: AgencyContract['slaTerms'];
    serviceAreas?: string[];
    serviceTypes?: string[];
    caregiverRequirements?: AgencyContract['caregiverRequirements'];
    complianceRequirements?: AgencyContract['complianceRequirements'];
    accountManagerId?: string;
    accountManagerName?: string;
  }) {
    return this.agencyContractService.createAgencyContract(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency contract by ID' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async getAgencyContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyContractService.getAgencyContract(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agency contract' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async updateAgencyContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      title?: string;
      description?: string;
      baseFee?: number;
      platformFeePercentage?: number;
      volumeDiscountTiers?: AgencyContract['volumeDiscountTiers'];
      slaTerms?: AgencyContract['slaTerms'];
      serviceAreas?: string[];
      serviceTypes?: string[];
      caregiverRequirements?: AgencyContract['caregiverRequirements'];
      complianceRequirements?: AgencyContract['complianceRequirements'];
      accountManagerId?: string;
      accountManagerName?: string;
    },
  ) {
    return this.agencyContractService.updateAgencyContract(id, dto);
  }

  @Post(':id/submit-for-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit agency contract for review' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async submitForReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyContractService.submitForReview(id);
  }

  @Post(':id/send-for-signatures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send agency contract for signatures' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async sendForSignatures(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyContractService.sendForSignatures(id);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign agency contract' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async signAgencyContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      signatoryId: string;
      signatoryName: string;
      party: 'agency' | 'platform';
    },
  ) {
    return this.agencyContractService.signAgencyContract(
      id,
      dto.signatoryId,
      dto.signatoryName,
      dto.party,
    );
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate agency contract' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async terminateAgencyContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reason: string },
  ) {
    return this.agencyContractService.terminateAgencyContract(id, dto.reason);
  }

  @Post(':id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Put agency contract on hold' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async holdAgencyContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyContractService.holdAgencyContract(id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume agency contract from hold' })
  @ApiParam({ name: 'id', description: 'Agency Contract ID' })
  async resumeAgencyContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyContractService.resumeAgencyContract(id);
  }

  @Get()
  @ApiOperation({ summary: 'List agency contracts' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AgencyContractStatus })
  @ApiQuery({ name: 'type', required: false, enum: AgencyContractType })
  async listAgencyContracts(
    @Query('agencyId') agencyId?: string,
    @Query('status') status?: AgencyContractStatus,
    @Query('type') type?: AgencyContractType,
  ) {
    return this.agencyContractService.listAgencyContracts(agencyId, status, type);
  }

  @Get('agency/:agencyId/active')
  @ApiOperation({ summary: 'Get active contracts for an agency' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  async getActiveAgencyContracts(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.agencyContractService.getActiveAgencyContracts(agencyId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring agency contracts' })
  @ApiQuery({ name: 'daysAhead', required: false, description: 'Days ahead (default 30)' })
  async getExpiringAgencyContracts(@Query('daysAhead') daysAhead?: number) {
    return this.agencyContractService.getExpiringAgencyContracts(daysAhead);
  }

  @Get('agency/:agencyId/discounted-fee')
  @ApiOperation({ summary: 'Calculate discounted fee based on volume' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiQuery({ name: 'hoursWorked', required: true })
  async calculateDiscountedFee(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('hoursWorked') hoursWorked: number,
  ) {
    return this.agencyContractService.calculateDiscountedFee(agencyId, hoursWorked);
  }
}

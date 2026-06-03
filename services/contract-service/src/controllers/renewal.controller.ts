import {
  Controller,
  Get,
  Post,
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
import { RenewalService } from '../services/renewal.service';
import { RenewalType } from '../entities/contract-renewal.entity';

/**
 * Renewal Controller
 * 
 * Phase 5E: Contract renewals management
 */
@ApiTags('Contract Renewals')
@Controller('renewals')
export class RenewalController {
  constructor(private readonly renewalService: RenewalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a renewal request' })
  @ApiResponse({ status: 201, description: 'Renewal created successfully' })
  async createRenewal(@Body() dto: {
    originalContractId: string;
    type: RenewalType;
    proposedStartDate: Date;
    proposedEndDate: Date;
    proposedTerms?: {
      hourlyRate?: number;
      currency?: string;
      paymentFrequency?: string;
      overtimeRate?: number;
      specialConditions?: string[];
    };
    renewalDeadline: Date;
    initiatedById?: string;
    initiatedByName?: string;
  }) {
    return this.renewalService.createRenewal(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get renewal by ID' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  async getRenewal(@Param('id', ParseUUIDPipe) id: string) {
    return this.renewalService.getRenewal(id);
  }

  @Post(':id/offer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Offer renewal to parties' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  async offerRenewal(@Param('id', ParseUUIDPipe) id: string) {
    return this.renewalService.offerRenewal(id);
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to renewal offer' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  async respondToRenewal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      role: 'patient' | 'caregiver';
      response: 'accepted' | 'declined' | 'counter_offered';
      counterTerms?: Record<string, any>;
      declineReason?: string;
    },
  ) {
    return this.renewalService.respondToRenewal(
      id,
      dto.role,
      dto.response,
      dto.counterTerms,
      dto.declineReason,
    );
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute accepted renewal' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  async executeRenewal(@Param('id', ParseUUIDPipe) id: string) {
    return this.renewalService.executeRenewal(id);
  }

  @Post(':id/reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send renewal reminder' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  async sendRenewalReminder(@Param('id', ParseUUIDPipe) id: string) {
    return this.renewalService.sendRenewalReminder(id);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'List renewals for a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  async listContractRenewals(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.renewalService.listContractRenewals(contractId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get contracts expiring soon' })
  @ApiQuery({ name: 'daysAhead', required: false, description: 'Days ahead (default 30)' })
  async getExpiringContracts(@Query('daysAhead') daysAhead?: number) {
    return this.renewalService.getExpiringContracts(daysAhead);
  }
}

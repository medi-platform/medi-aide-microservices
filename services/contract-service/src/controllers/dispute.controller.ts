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
import { DisputeService } from '../services/dispute.service';
import { DisputeType, DisputeSeverity, DisputeResolutionType } from '../entities/contract-dispute.entity';

/**
 * Dispute Controller
 * 
 * Phase 5E: Contract disputes management
 */
@ApiTags('Contract Disputes')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a contract dispute' })
  @ApiResponse({ status: 201, description: 'Dispute created successfully' })
  async createDispute(@Body() dto: {
    contractId: string;
    type: DisputeType;
    severity: DisputeSeverity;
    subject: string;
    description: string;
    raisedById: string;
    raisedByName: string;
    raisedByRole: 'patient' | 'caregiver' | 'guardian' | 'agency';
    againstId: string;
    againstName: string;
    againstRole: 'patient' | 'caregiver' | 'guardian' | 'agency';
    disputedAmount?: number;
    currency?: string;
    evidenceFileIds?: string[];
  }) {
    return this.disputeService.createDispute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async getDispute(@Param('id', ParseUUIDPipe) id: string) {
    return this.disputeService.getDispute(id);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign dispute to reviewer' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async assignDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { assignedToId: string; assignedToName: string },
  ) {
    return this.disputeService.assignDispute(id, dto.assignedToId, dto.assignedToName);
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async respondToDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { responseText: string },
  ) {
    return this.disputeService.respondToDispute(id, dto.responseText);
  }

  @Post(':id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async escalateDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      escalatedById: string;
      escalatedByName: string;
      reason: string;
      toLevel: string;
    },
  ) {
    return this.disputeService.escalateDispute(
      id,
      dto.escalatedById,
      dto.escalatedByName,
      dto.reason,
      dto.toLevel,
    );
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      resolutionType: DisputeResolutionType;
      resolutionSummary: string;
      resolutionAmount?: number;
      resolvedById: string;
      resolvedByName: string;
    },
  ) {
    return this.disputeService.resolveDispute(id, dto);
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async withdrawDispute(@Param('id', ParseUUIDPipe) id: string) {
    return this.disputeService.withdrawDispute(id);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'List disputes for a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  async listContractDisputes(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.disputeService.listContractDisputes(contractId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List disputes for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'role', required: false, enum: ['raised', 'against'] })
  async listUserDisputes(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('role') role?: 'raised' | 'against',
  ) {
    return this.disputeService.listUserDisputes(userId, role);
  }

  @Get('open')
  @ApiOperation({ summary: 'Get all open disputes' })
  async getOpenDisputes() {
    return this.disputeService.getOpenDisputes();
  }
}

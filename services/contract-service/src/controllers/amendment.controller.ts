import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AmendmentService } from '../services/amendment.service';
import { AmendmentType } from '../entities/contract-amendment.entity';

/**
 * Amendment Controller
 * 
 * Phase 5E: Contract amendments management
 */
@ApiTags('Contract Amendments')
@Controller('amendments')
export class AmendmentController {
  constructor(private readonly amendmentService: AmendmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a contract amendment' })
  @ApiResponse({ status: 201, description: 'Amendment created successfully' })
  async createAmendment(@Body() dto: {
    contractId: string;
    type: AmendmentType;
    title: string;
    description: string;
    changes: { field: string; previousValue: any; newValue: any; reason?: string }[];
    newTerms?: Record<string, any>;
    effectiveDate: Date;
    requestedById: string;
    requestedByName: string;
  }) {
    return this.amendmentService.createAmendment(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get amendment by ID' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async getAmendment(@Param('id', ParseUUIDPipe) id: string) {
    return this.amendmentService.getAmendment(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update amendment (draft only)' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async updateAmendment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      title?: string;
      description?: string;
      changes?: { field: string; previousValue: any; newValue: any; reason?: string }[];
      newTerms?: Record<string, any>;
      effectiveDate?: Date;
    },
  ) {
    return this.amendmentService.updateAmendment(id, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit amendment for approval' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async submitForApproval(@Param('id', ParseUUIDPipe) id: string) {
    return this.amendmentService.submitForApproval(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve amendment' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async approveAmendment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { approvedById: string; approvedByName: string },
  ) {
    return this.amendmentService.approveAmendment(id, dto.approvedById, dto.approvedByName);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject amendment' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async rejectAmendment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reason: string },
  ) {
    return this.amendmentService.rejectAmendment(id, dto.reason);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign amendment' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async signAmendment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { role: 'patient' | 'caregiver' },
  ) {
    return this.amendmentService.signAmendment(id, dto.role);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate fully signed amendment' })
  @ApiParam({ name: 'id', description: 'Amendment ID' })
  async activateAmendment(@Param('id', ParseUUIDPipe) id: string) {
    return this.amendmentService.activateAmendment(id);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'List amendments for a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  async listContractAmendments(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.amendmentService.listContractAmendments(contractId);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ContractService } from '../services/contract.service';
import { ContractStatus, ContractType } from '../entities/contract.entity';

/**
 * Contract Controller
 * 
 * Phase 5E: Contract Service Enhancement
 * Main contract CRUD and lifecycle management
 */
@ApiTags('Contracts')
@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  async createContract(@Body() dto: {
    careRequestId: string;
    caregiverId: string;
    patientId: string;
    templateId?: string;
    type?: ContractType;
    effectiveDate?: Date;
    expirationDate?: Date;
    terms?: any;
  }) {
    return this.contractService.createContract(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async getContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.getContract(id);
  }

  @Get('care-request/:careRequestId')
  @ApiOperation({ summary: 'Get contract by care request ID' })
  @ApiParam({ name: 'careRequestId', description: 'Care Request ID' })
  async getContractByCareRequest(
    @Param('careRequestId', ParseUUIDPipe) careRequestId: string,
  ) {
    return this.contractService.getContractByCareRequest(careRequestId);
  }

  @Get('caregiver/:caregiverId')
  @ApiOperation({ summary: 'Get contracts for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiQuery({ name: 'status', required: false, enum: ContractStatus })
  async getCaregiverContracts(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: ContractStatus,
  ) {
    return this.contractService.getCaregiverContracts(caregiverId, status);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get contracts for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'status', required: false, enum: ContractStatus })
  async getPatientContracts(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('status') status?: ContractStatus,
  ) {
    return this.contractService.getPatientContracts(patientId, status);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async updateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      effectiveDate?: Date;
      expirationDate?: Date;
      terms?: any;
    },
  ) {
    return this.contractService.updateContract(id, dto);
  }

  @Post(':id/send-for-signatures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send contract for signatures' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async sendForSignatures(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.sendForSignatures(id);
  }

  @Get(':id/signatures')
  @ApiOperation({ summary: 'Get signature status for a contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async getSignatures(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.getSignatures(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a fully signed contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async activateContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.activateContract(id);
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate an active contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async terminateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reason: string },
  ) {
    return this.contractService.terminateContract(id, dto.reason);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async cancelContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reason: string },
  ) {
    return this.contractService.cancelContract(id, dto.reason);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get contract event history' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async getEventHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.getEventHistory(id);
  }
}

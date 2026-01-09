import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
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
import { VersionService } from '../services/version.service';

/**
 * Version Controller
 * 
 * Phase 5E: Contract version history and audit trail
 */
@ApiTags('Contract Versions')
@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Post('contracts/:contractId')
  @ApiOperation({ summary: 'Create a new version snapshot' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  async createVersion(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: {
      changeType: 'amendment' | 'renewal' | 'correction' | 'status_change' | 'initial';
      changeReason?: string;
      createdById?: string;
      createdByName?: string;
      amendmentId?: string;
      renewalId?: string;
    },
  ) {
    return this.versionService.createVersion(
      contractId,
      dto.changeType,
      dto.changeReason,
      dto.createdById,
      dto.createdByName,
      dto.amendmentId,
      dto.renewalId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  @ApiParam({ name: 'id', description: 'Version ID' })
  async getVersion(@Param('id', ParseUUIDPipe) id: string) {
    return this.versionService.getVersion(id);
  }

  @Get('contracts/:contractId')
  @ApiOperation({ summary: 'List all versions of a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  async listContractVersions(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.versionService.listContractVersions(contractId);
  }

  @Get('contracts/:contractId/version/:versionNumber')
  @ApiOperation({ summary: 'Get specific version of a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number' })
  async getContractVersion(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    return this.versionService.getContractVersion(contractId, versionNumber);
  }

  @Get('contracts/:contractId/latest')
  @ApiOperation({ summary: 'Get latest version of a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  async getLatestVersion(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.versionService.getLatestVersion(contractId);
  }

  @Get('contracts/:contractId/verify')
  @ApiOperation({ summary: 'Verify version chain integrity' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  async verifyVersionChain(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.versionService.verifyVersionChain(contractId);
  }

  @Get('contracts/:contractId/compare')
  @ApiOperation({ summary: 'Compare two versions of a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiQuery({ name: 'version1', required: true })
  @ApiQuery({ name: 'version2', required: true })
  async compareVersions(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Query('version1', ParseIntPipe) version1: number,
    @Query('version2', ParseIntPipe) version2: number,
  ) {
    return this.versionService.compareVersions(contractId, version1, version2);
  }

  @Post('contracts/:contractId/restore/:versionNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore contract to a previous version' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number to restore' })
  async restoreVersion(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Body() dto: { restoredById?: string; restoredByName?: string },
  ) {
    return this.versionService.restoreVersion(
      contractId,
      versionNumber,
      dto.restoredById,
      dto.restoredByName,
    );
  }
}

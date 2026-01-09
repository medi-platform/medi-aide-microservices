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
import { ClauseService } from '../services/clause.service';
import { ClauseCategory, ClauseStatus } from '../entities/contract-clause.entity';

/**
 * Clause Controller
 * 
 * Phase 5E: Reusable contract clauses management
 * Supports Canadian provincial compliance
 */
@ApiTags('Contract Clauses')
@Controller('clauses')
export class ClauseController {
  constructor(private readonly clauseService: ClauseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a contract clause' })
  @ApiResponse({ status: 201, description: 'Clause created successfully' })
  async createClause(@Body() dto: {
    key: string;
    name: string;
    description?: string;
    category: ClauseCategory;
    jurisdiction: string;
    contentEn: string;
    contentFr?: string;
    legalReference?: string;
    isMandatory?: boolean;
    mandatoryForTypes?: string[];
    mandatoryForJurisdictions?: string[];
    placeholders?: { name: string; description: string; required: boolean; defaultValue?: string }[];
    createdBy?: string;
  }) {
    return this.clauseService.createClause(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clause by ID' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async getClause(@Param('id', ParseUUIDPipe) id: string) {
    return this.clauseService.getClause(id);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get clause by key' })
  @ApiParam({ name: 'key', description: 'Clause key' })
  async getClauseByKey(@Param('key') key: string) {
    return this.clauseService.getClauseByKey(key);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update clause' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async updateClause(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      contentEn?: string;
      contentFr?: string;
      legalReference?: string;
      isMandatory?: boolean;
      mandatoryForTypes?: string[];
      mandatoryForJurisdictions?: string[];
      placeholders?: { name: string; description: string; required: boolean; defaultValue?: string }[];
    },
  ) {
    return this.clauseService.updateClause(id, dto);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve clause for use' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async approveClause(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { approvedBy: string },
  ) {
    return this.clauseService.approveClause(id, dto.approvedBy);
  }

  @Post(':id/legal-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark clause as legally reviewed' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async legalReviewClause(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reviewedBy: string },
  ) {
    return this.clauseService.legalReviewClause(id, dto.reviewedBy);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive clause' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async archiveClause(@Param('id', ParseUUIDPipe) id: string) {
    return this.clauseService.archiveClause(id);
  }

  @Post(':id/deprecate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deprecate clause' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async deprecateClause(@Param('id', ParseUUIDPipe) id: string) {
    return this.clauseService.deprecateClause(id);
  }

  @Get()
  @ApiOperation({ summary: 'List clauses' })
  @ApiQuery({ name: 'category', required: false, enum: ClauseCategory })
  @ApiQuery({ name: 'status', required: false, enum: ClauseStatus })
  @ApiQuery({ name: 'jurisdiction', required: false })
  @ApiQuery({ name: 'isMandatory', required: false })
  async listClauses(
    @Query('category') category?: ClauseCategory,
    @Query('status') status?: ClauseStatus,
    @Query('jurisdiction') jurisdiction?: string,
    @Query('isMandatory') isMandatory?: boolean,
  ) {
    return this.clauseService.listClauses({ category, status, jurisdiction, isMandatory });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active clauses' })
  @ApiQuery({ name: 'jurisdiction', required: false })
  async getActiveClauses(@Query('jurisdiction') jurisdiction?: string) {
    return this.clauseService.getActiveClauses(jurisdiction);
  }

  @Get('mandatory')
  @ApiOperation({ summary: 'Get mandatory clauses for contract type and jurisdiction' })
  @ApiQuery({ name: 'contractType', required: true })
  @ApiQuery({ name: 'jurisdiction', required: true })
  async getMandatoryClauses(
    @Query('contractType') contractType: string,
    @Query('jurisdiction') jurisdiction: string,
  ) {
    return this.clauseService.getMandatoryClauses(contractType, jurisdiction);
  }

  @Post(':id/render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Render clause with data' })
  @ApiParam({ name: 'id', description: 'Clause ID' })
  async renderClause(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { data: Record<string, any>; locale?: 'en' | 'fr' },
  ) {
    return this.clauseService.renderClause(id, dto.data, dto.locale);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone a clause' })
  @ApiParam({ name: 'id', description: 'Clause ID to clone' })
  async cloneClause(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { newKey: string; newName: string; createdBy?: string },
  ) {
    return this.clauseService.cloneClause(id, dto.newKey, dto.newName, dto.createdBy);
  }
}

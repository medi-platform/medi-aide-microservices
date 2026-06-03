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
import { ReportDefinitionService } from '../services/report-definition.service';
import { ReportCategory, ReportStatus, OutputFormat } from '../entities/report-definition.entity';

/**
 * Report Definition Controller
 * Phase 5H: Manage report definitions
 */
@ApiTags('Report Definitions')
@Controller('definitions')
export class DefinitionController {
  constructor(private readonly definitionService: ReportDefinitionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a report definition' })
  @ApiResponse({ status: 201, description: 'Definition created' })
  async createDefinition(@Body() dto: {
    key: string;
    name: string;
    nameFr?: string;
    description?: string;
    descriptionFr?: string;
    category: ReportCategory;
    isSystem?: boolean;
    supportedFormats: OutputFormat[];
    defaultFormat?: OutputFormat;
    dataSource: string;
    queryTemplate?: string;
    parameters?: any[];
    requiredPermissions?: string[];
    agencySpecific?: boolean;
  }) {
    return this.definitionService.createDefinition(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List report definitions' })
  @ApiQuery({ name: 'category', required: false, enum: ReportCategory })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  async listDefinitions(
    @Query('category') category?: ReportCategory,
    @Query('status') status?: ReportStatus,
  ) {
    return this.definitionService.listDefinitions(category, status);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available reports for user' })
  @ApiQuery({ name: 'permissions', required: false })
  @ApiQuery({ name: 'agencyId', required: false })
  async getAvailableReports(
    @Query('permissions') permissions?: string,
    @Query('agencyId') agencyId?: string,
  ) {
    const perms = permissions ? permissions.split(',') : [];
    return this.definitionService.getAvailableReports(perms, agencyId);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system report definitions' })
  async getSystemReports() {
    return this.definitionService.getSystemReports();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report definition by ID' })
  @ApiParam({ name: 'id', description: 'Definition ID' })
  async getDefinition(@Param('id', ParseUUIDPipe) id: string) {
    return this.definitionService.getDefinition(id);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get report definition by key' })
  @ApiParam({ name: 'key', description: 'Definition key' })
  async getDefinitionByKey(@Param('key') key: string) {
    return this.definitionService.getDefinitionByKey(key);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update report definition' })
  @ApiParam({ name: 'id', description: 'Definition ID' })
  async updateDefinition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      name?: string;
      nameFr?: string;
      description?: string;
      supportedFormats?: OutputFormat[];
      parameters?: any[];
    },
  ) {
    return this.definitionService.updateDefinition(id, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate report definition' })
  @ApiParam({ name: 'id', description: 'Definition ID' })
  async activateDefinition(@Param('id', ParseUUIDPipe) id: string) {
    return this.definitionService.activateDefinition(id);
  }

  @Post(':id/deprecate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deprecate report definition' })
  @ApiParam({ name: 'id', description: 'Definition ID' })
  async deprecateDefinition(@Param('id', ParseUUIDPipe) id: string) {
    return this.definitionService.deprecateDefinition(id);
  }
}

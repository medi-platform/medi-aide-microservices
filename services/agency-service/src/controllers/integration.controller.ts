import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  IntegrationService,
  CreateIntegrationDto,
  UpdateIntegrationDto,
} from '../services/integration.service';
import { IntegrationSystemType, HealthStatus } from '../entities/integration-config.entity';
import { SyncType } from '../entities/integration-sync-log.entity';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new integration configuration' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Integration created successfully' })
  async createIntegration(@Body() dto: CreateIntegrationDto) {
    const config = await this.integrationService.createIntegration(dto);
    return {
      success: true,
      data: config,
      message: 'Integration created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List integrations for an agency' })
  @ApiQuery({ name: 'agency_id', required: true })
  async listIntegrations(@Query('agency_id') agencyId: string) {
    const integrations = await this.integrationService.listIntegrations(agencyId);
    return {
      success: true,
      data: integrations,
    };
  }

  @Get('available')
  @ApiOperation({ summary: 'List available integration types' })
  async listAvailableIntegrations() {
    const integrations = Object.values(IntegrationSystemType).map(type => ({
      type,
      name: type,
      description: this.getIntegrationDescription(type),
      category: this.getIntegrationCategory(type),
    }));
    return {
      success: true,
      data: integrations,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Integration retrieved' })
  async getIntegration(@Param('id', ParseUUIDPipe) id: string) {
    const config = await this.integrationService.getIntegrationById(id);
    return {
      success: true,
      data: config,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update integration configuration' })
  @ApiParam({ name: 'id', type: String })
  async updateIntegration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    const config = await this.integrationService.updateIntegration(id, dto);
    return {
      success: true,
      data: config,
      message: 'Integration updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete integration' })
  @ApiParam({ name: 'id', type: String })
  async deleteIntegration(@Param('id', ParseUUIDPipe) id: string) {
    await this.integrationService.deleteIntegration(id);
    return {
      success: true,
      message: 'Integration deleted successfully',
    };
  }

  @Post(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable integration' })
  @ApiParam({ name: 'id', type: String })
  async toggleIntegration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { is_active: boolean },
  ) {
    const config = await this.integrationService.toggleIntegration(id, body.is_active);
    return {
      success: true,
      data: config,
      message: body.is_active ? 'Integration enabled' : 'Integration disabled',
    };
  }

  @Post(':id/connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete OAuth connection for integration' })
  @ApiParam({ name: 'id', type: String })
  async connectIntegration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      access_token: string;
      refresh_token?: string;
      expires_at?: string;
      scopes?: string[];
      external_account_id?: string;
      external_account_name?: string;
      connected_by?: string;
    },
  ) {
    const connection = await this.integrationService.createConnection(
      id,
      {
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: body.expires_at ? new Date(body.expires_at) : undefined,
        scopes: body.scopes,
      },
      body.external_account_id ? { id: body.external_account_id, name: body.external_account_name || '' } : undefined,
      body.connected_by,
    );
    return {
      success: true,
      data: connection,
      message: 'Integration connected successfully',
    };
  }

  @Post(':id/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect integration' })
  @ApiParam({ name: 'id', type: String })
  async disconnectIntegration(@Param('id', ParseUUIDPipe) id: string) {
    await this.integrationService.disconnectIntegration(id);
    return {
      success: true,
      message: 'Integration disconnected successfully',
    };
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger a manual sync' })
  @ApiParam({ name: 'id', type: String })
  async triggerSync(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      sync_type?: SyncType;
      direction: 'inbound' | 'outbound';
      entity_types: string[];
      triggered_by?: string;
    },
  ) {
    const syncLog = await this.integrationService.startSync(
      id,
      body.sync_type || SyncType.MANUAL,
      body.direction,
      body.entity_types,
      body.triggered_by,
    );
    return {
      success: true,
      data: syncLog,
      message: 'Sync started',
    };
  }

  @Get(':id/sync-history')
  @ApiOperation({ summary: 'Get sync history for integration' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSyncHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit = 20,
  ) {
    const history = await this.integrationService.getSyncHistory(id, +limit);
    return {
      success: true,
      data: history,
    };
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get integration health status' })
  @ApiParam({ name: 'id', type: String })
  async getHealth(@Param('id', ParseUUIDPipe) id: string) {
    const config = await this.integrationService.getIntegrationById(id);
    return {
      success: true,
      data: {
        health_status: config.health_status,
        last_sync_at: config.last_sync_at,
        error_count: config.error_count,
        last_error: config.last_error,
        last_error_at: config.last_error_at,
      },
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private getIntegrationDescription(type: IntegrationSystemType): string {
    const descriptions: Record<IntegrationSystemType, string> = {
      [IntegrationSystemType.ALAYACARE]: 'AlayaCare home care management platform',
      [IntegrationSystemType.WELLSKY]: 'WellSky personal care software',
      [IntegrationSystemType.AXISCARE]: 'AxisCare home care management',
      [IntegrationSystemType.POINTCLICKCARE]: 'PointClickCare senior care platform',
      [IntegrationSystemType.UKG]: 'UKG workforce management',
      [IntegrationSystemType.TALENTLMS]: 'TalentLMS learning management system',
      [IntegrationSystemType.MICROSOFT_365]: 'Microsoft 365 (Teams, Calendar, Email)',
      [IntegrationSystemType.ADP]: 'ADP payroll and HR',
      [IntegrationSystemType.WORKDAY]: 'Workday HR management',
      [IntegrationSystemType.GENERIC]: 'Generic REST API integration',
      [IntegrationSystemType.FHIR]: 'HL7 FHIR health data exchange',
    };
    return descriptions[type] || 'Unknown integration';
  }

  private getIntegrationCategory(type: IntegrationSystemType): string {
    const categories: Record<IntegrationSystemType, string> = {
      [IntegrationSystemType.ALAYACARE]: 'Home Care Platform',
      [IntegrationSystemType.WELLSKY]: 'Home Care Platform',
      [IntegrationSystemType.AXISCARE]: 'Home Care Platform',
      [IntegrationSystemType.POINTCLICKCARE]: 'Home Care Platform',
      [IntegrationSystemType.UKG]: 'Workforce Management',
      [IntegrationSystemType.TALENTLMS]: 'Learning Management',
      [IntegrationSystemType.MICROSOFT_365]: 'Productivity',
      [IntegrationSystemType.ADP]: 'Payroll & HR',
      [IntegrationSystemType.WORKDAY]: 'Payroll & HR',
      [IntegrationSystemType.GENERIC]: 'Custom',
      [IntegrationSystemType.FHIR]: 'Healthcare Interoperability',
    };
    return categories[type] || 'Other';
  }
}

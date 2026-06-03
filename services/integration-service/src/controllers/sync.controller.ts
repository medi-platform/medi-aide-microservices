import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SyncService } from '../services/sync.service';

@Controller('integrations/:integrationId/sync')
@ApiTags('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post('start') @ApiOperation({ summary: 'Start sync' })
  startSync(@Param('integrationId', ParseUUIDPipe) integrationId: string, @Body() dto: any) { return this.service.startSync(integrationId, dto); }

  @Get('status') @ApiOperation({ summary: 'Get sync status' })
  getStatus(@Param('integrationId', ParseUUIDPipe) integrationId: string) { return this.service.getStatus(integrationId); }

  @Get('history') @ApiOperation({ summary: 'Get sync history' })
  getHistory(@Param('integrationId', ParseUUIDPipe) integrationId: string) { return this.service.getHistory(integrationId); }

  @Post('import') @ApiOperation({ summary: 'Import data' })
  importData(@Param('integrationId', ParseUUIDPipe) integrationId: string, @Body() dto: any) { return this.service.importData(integrationId, dto); }

  @Post('export') @ApiOperation({ summary: 'Export data' })
  exportData(@Param('integrationId', ParseUUIDPipe) integrationId: string, @Body() dto: any) { return this.service.exportData(integrationId, dto); }
}



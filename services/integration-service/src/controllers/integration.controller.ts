import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntegrationService } from '../services/integration.service';

@Controller('integrations')
@ApiTags('integrations')
export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  @Get() @ApiOperation({ summary: 'List integrations' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('available') @ApiOperation({ summary: 'Get available integrations' })
  getAvailable() { return this.service.getAvailable(); }

  @Post() @ApiOperation({ summary: 'Create integration' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') @ApiOperation({ summary: 'Get integration' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Put(':id') @ApiOperation({ summary: 'Update integration' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/enable') @ApiOperation({ summary: 'Enable integration' })
  enable(@Param('id', ParseUUIDPipe) id: string) { return this.service.enable(id); }

  @Patch(':id/disable') @ApiOperation({ summary: 'Disable integration' })
  disable(@Param('id', ParseUUIDPipe) id: string) { return this.service.disable(id); }

  @Post(':id/test') @ApiOperation({ summary: 'Test connection' })
  testConnection(@Param('id', ParseUUIDPipe) id: string) { return this.service.testConnection(id); }

  @Delete(':id') @ApiOperation({ summary: 'Delete integration' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}


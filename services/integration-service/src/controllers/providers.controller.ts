import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Providers Controller
 * Manages external healthcare provider integrations.
 */
@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {

  @Get()
  @ApiOperation({ summary: 'List integrated providers' })
  async getProviders(@Query('type') type?: string) {
    return {
      providers: [
        { id: 'ohip', name: 'Ontario Health Insurance Plan', type: 'insurance', status: 'active' },
        { id: 'telus', name: 'TELUS Health', type: 'ehr', status: 'active' },
      ],
      total: 2,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Add provider integration' })
  async addProvider(@Body() dto: { name: string; type: string; config: any }) {
    return { id: `prov_${Date.now()}`, ...dto, status: 'pending', createdAt: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider details' })
  async getProvider(@Param('id') id: string) {
    return { id, status: 'active', config: {} };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update provider config' })
  async updateProvider(@Param('id') id: string, @Body() dto: any) {
    return { id, ...dto, updatedAt: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove provider integration' })
  async removeProvider(@Param('id') id: string) {
    return { id, removed: true };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test provider connection' })
  async testConnection(@Param('id') id: string) {
    return { id, connected: true, latencyMs: 45, testedAt: new Date().toISOString() };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get provider health status' })
  async getProviderStatus(@Param('id') id: string) {
    return { id, healthy: true, lastSyncAt: new Date().toISOString() };
  }
}


import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AuditService } from '../services/audit.service';

@Controller()
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'audit' };
  }

  @Post('logs')
  async createLog(@Body() data: any) {
    return this.audit.createAuditLog(data);
  }

  // Minimal endpoint for microservice remote adapter
  @Post('events')
  async createEvent(@Body() data: any) {
    const dbDisabled = process.env.DISABLE_DB === 'true';
    if (dbDisabled) {
      return { status: 'accepted' };
    }
    await this.audit.createAuditLog(data);
    return { status: 'stored' };
  }

  @Get('logs')
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.audit.getAuditLogs({ userId, action, startDate, endDate });
  }

  @Get('compliance')
  async getComplianceStatus() {
    return this.audit.getComplianceStatus();
  }

  @Post('compliance/review')
  async reviewCompliance(@Body() data: any) {
    return this.audit.updateComplianceRecord(data);
  }

  @Get('reports/hipaa')
  async getHIPAAReport() {
    return this.audit.generateHIPAAReport();
  }
}

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';

@Controller('incidents/reports')
@ApiTags('reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get('summary') @ApiOperation({ summary: 'Get summary report' })
  getSummary(@Query('period') period: string) { return this.service.getSummary(period); }

  @Get('by-type') @ApiOperation({ summary: 'Get by type' })
  getByType(@Query('startDate') startDate: string, @Query('endDate') endDate: string) { return this.service.getByType(startDate, endDate); }

  @Get('by-severity') @ApiOperation({ summary: 'Get by severity' })
  getBySeverity(@Query() query: any) { return this.service.getBySeverity(query); }

  @Get('trends') @ApiOperation({ summary: 'Get trends' })
  getTrends(@Query('period') period: string) { return this.service.getTrends(period); }

  @Post('generate') @ApiOperation({ summary: 'Generate report' })
  generate(@Body() dto: any) { return this.service.generate(dto); }
}


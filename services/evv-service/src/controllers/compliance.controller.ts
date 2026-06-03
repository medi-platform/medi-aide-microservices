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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from '../services/compliance.service';

class AddExceptionDto {
  exceptionType!: string;
  reason!: string;
  notes?: string;
}

@Controller('compliance')
@ApiTags('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('visit/:visitId')
  @ApiOperation({ summary: 'Get compliance record for a visit' })
  @ApiResponse({ status: 200, description: 'Compliance record' })
  @ApiResponse({ status: 404, description: 'Compliance record not found' })
  async getVisitCompliance(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.complianceService.getByVisitId(visitId);
  }

  @Post('visit/:visitId/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate and update compliance status for a visit' })
  @ApiResponse({ status: 200, description: 'Updated compliance record' })
  async calculateCompliance(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.complianceService.calculateComplianceStatus(visitId);
  }

  @Post('visit/:visitId/exception')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add exception to compliance record' })
  @ApiResponse({ status: 201, description: 'Exception added' })
  @ApiResponse({ status: 404, description: 'Compliance record not found' })
  async addException(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body() dto: AddExceptionDto,
    @Query('approvedBy') approvedBy: string,
  ) {
    return this.complianceService.addException(
      visitId,
      dto.exceptionType,
      dto.reason,
      approvedBy,
      dto.notes,
    );
  }

  @Post('visit/:visitId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit visit to state aggregator' })
  @ApiResponse({ status: 200, description: 'Submission result' })
  @ApiResponse({ status: 400, description: 'Aggregator not enabled' })
  async submitToAggregator(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.complianceService.submitToAggregator(visitId);
  }

  @Get('non-compliant')
  @ApiOperation({ summary: 'Get non-compliant visits for review' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'payerId', required: false })
  async getNonCompliantVisits(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('payerId') payerId?: string,
  ) {
    return this.complianceService.getNonCompliantVisits(
      new Date(startDate),
      new Date(endDate),
      payerId,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get compliance summary report' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getComplianceSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.complianceService.getComplianceSummary(
      new Date(startDate),
      new Date(endDate),
    );
  }
}

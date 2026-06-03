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
import { BackgroundCheckService } from '../services/background-check.service';
import {
  BackgroundCheckType,
  BackgroundCheckResult,
} from '../entities/background-check.entity';

class InitiateCheckDto {
  type!: BackgroundCheckType;
  provider?: string;
}

class UpdateResultsDto {
  result!: BackgroundCheckResult;
  findings?: {
    records?: Array<{
      type: string;
      description: string;
      date?: string;
      disposition?: string;
    }>;
    notes?: string;
  };
  externalReportUrl?: string;
}

class ReviewCheckDto {
  approved!: boolean;
  reviewerId!: string;
  notes?: string;
}

class ValidateChecksDto {
  requiredTypes!: BackgroundCheckType[];
}

@Controller('background-checks')
@ApiTags('background-checks')
export class BackgroundCheckController {
  constructor(private readonly bgCheckService: BackgroundCheckService) {}

  @Post('caregiver/:caregiverId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate a background check for a caregiver' })
  @ApiResponse({ status: 201, description: 'Background check initiated' })
  async initiate(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: InitiateCheckDto,
  ) {
    return this.bgCheckService.initiateCheck(caregiverId, dto.type, dto.provider);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit background check to provider' })
  async submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.bgCheckService.submitToProvider(id);
  }

  @Put(':id/results')
  @ApiOperation({ summary: 'Update background check with provider results' })
  async updateResults(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResultsDto,
  ) {
    return this.bgCheckService.updateWithResults(
      id,
      dto.result,
      dto.findings,
      dto.externalReportUrl,
    );
  }

  @Put(':id/review')
  @ApiOperation({ summary: 'Review and approve/reject a flagged check' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCheckDto,
  ) {
    return this.bgCheckService.review(id, dto.approved, dto.reviewerId, dto.notes);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get background check by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bgCheckService.getById(id);
  }

  @Get('caregiver/:caregiverId')
  @ApiOperation({ summary: 'Get all background checks for a caregiver' })
  async getCaregiverChecks(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.bgCheckService.getCaregiverChecks(caregiverId);
  }

  @Get('caregiver/:caregiverId/summary')
  @ApiOperation({ summary: 'Get background check summary for a caregiver' })
  async getCaregiverSummary(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.bgCheckService.getCaregiverSummary(caregiverId);
  }

  @Post('caregiver/:caregiverId/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate if caregiver has required background checks' })
  async validateChecks(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: ValidateChecksDto,
  ) {
    return this.bgCheckService.hasValidChecks(caregiverId, dto.requiredTypes);
  }

  @Get('pending-reviews')
  @ApiOperation({ summary: 'Get checks requiring review' })
  async getPendingReviews() {
    return this.bgCheckService.getPendingReviews();
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired background checks' })
  async getExpiredChecks() {
    return this.bgCheckService.getExpiredChecks();
  }
}

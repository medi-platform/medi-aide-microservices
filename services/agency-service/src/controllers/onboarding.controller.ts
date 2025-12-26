import { 
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from '../services/onboarding.service';

@Controller('agencies/onboarding')
@ApiTags('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start agency onboarding' })
  async startOnboarding(@Body() dto: any) {
    return this.onboardingService.start(dto);
  }

  @Get(':agencyId/progress')
  @ApiOperation({ summary: 'Get onboarding progress' })
  async getProgress(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.onboardingService.getProgress(agencyId);
  }

  @Patch(':agencyId/step/:step')
  @ApiOperation({ summary: 'Complete onboarding step' })
  async completeStep(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('step') step: string,
    @Body() dto: any
  ) {
    return this.onboardingService.completeStep(agencyId, step, dto);
  }

  @Post(':agencyId/documents')
  @ApiOperation({ summary: 'Upload onboarding document' })
  async uploadDocument(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.onboardingService.uploadDocument(agencyId, dto);
  }

  @Get(':agencyId/documents')
  @ApiOperation({ summary: 'Get onboarding documents' })
  async getDocuments(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.onboardingService.getDocuments(agencyId);
  }

  @Post(':agencyId/submit')
  @ApiOperation({ summary: 'Submit for review' })
  async submitForReview(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.onboardingService.submitForReview(agencyId);
  }

  @Patch(':agencyId/approve')
  @ApiOperation({ summary: 'Approve agency (admin only)' })
  async approve(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.onboardingService.approve(agencyId, dto);
  }

  @Patch(':agencyId/reject')
  @ApiOperation({ summary: 'Reject agency (admin only)' })
  async reject(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body('reason') reason: string
  ) {
    return this.onboardingService.reject(agencyId, reason);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending onboarding requests (admin)' })
  async getPendingOnboarding() {
    return this.onboardingService.getPendingOnboarding();
  }
}


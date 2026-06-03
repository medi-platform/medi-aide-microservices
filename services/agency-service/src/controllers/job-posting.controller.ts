import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  JobPostingService,
  CreateJobPostingDto,
  UpdateJobPostingDto,
  JobPostingFilter,
  SubmitApplicationDto,
} from '../services/job-posting.service';
import { JobPostingStatus, JobType } from '../entities/agency-job-posting.entity';
import { ApplicationStatus } from '../entities/agency-job-application.entity';

@ApiTags('Job Postings')
@ApiBearerAuth()
@Controller('job-postings')
export class JobPostingController {
  constructor(private readonly jobPostingService: JobPostingService) {}

  // ===========================================================================
  // Job Posting Endpoints
  // ===========================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Job posting created successfully' })
  async createJobPosting(@Body() dto: CreateJobPostingDto) {
    const posting = await this.jobPostingService.createJobPosting(dto);
    return {
      success: true,
      data: posting,
      message: 'Job posting created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List job postings with filters' })
  @ApiQuery({ name: 'agency_id', required: false })
  @ApiQuery({ name: 'status', required: false, enum: JobPostingStatus })
  @ApiQuery({ name: 'job_type', required: false, enum: JobType })
  @ApiQuery({ name: 'location_province', required: false })
  @ApiQuery({ name: 'is_remote', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job postings retrieved' })
  async listJobPostings(
    @Query('agency_id') agencyId?: string,
    @Query('status') status?: JobPostingStatus,
    @Query('job_type') jobType?: JobType,
    @Query('location_province') locationProvince?: string,
    @Query('is_remote') isRemote?: boolean,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const filter: JobPostingFilter = {
      agency_id: agencyId,
      status,
      job_type: jobType,
      location_province: locationProvince,
      is_remote: isRemote,
    };

    const result = await this.jobPostingService.listJobPostings(filter, +page, +limit);
    return {
      success: true,
      ...result,
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'List active public job postings (for caregivers)' })
  @ApiQuery({ name: 'location_province', required: false })
  @ApiQuery({ name: 'job_type', required: false, enum: JobType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPublicJobPostings(
    @Query('location_province') locationProvince?: string,
    @Query('job_type') jobType?: JobType,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const filter: JobPostingFilter = {
      status: JobPostingStatus.ACTIVE,
      location_province: locationProvince,
      job_type: jobType,
    };

    const result = await this.jobPostingService.listJobPostings(filter, +page, +limit);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job posting by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job posting retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job posting not found' })
  async getJobPosting(@Param('id', ParseUUIDPipe) id: string) {
    const posting = await this.jobPostingService.getJobPostingById(id);

    // Increment views
    await this.jobPostingService.incrementViews(id);

    return {
      success: true,
      data: posting,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job posting' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job posting updated' })
  async updateJobPosting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobPostingDto,
  ) {
    const posting = await this.jobPostingService.updateJobPosting(id, dto);
    return {
      success: true,
      data: posting,
      message: 'Job posting updated successfully',
    };
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft job posting' })
  @ApiParam({ name: 'id', type: String })
  async publishJobPosting(@Param('id', ParseUUIDPipe) id: string) {
    const posting = await this.jobPostingService.publishJobPosting(id);
    return {
      success: true,
      data: posting,
      message: 'Job posting published successfully',
    };
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active job posting' })
  @ApiParam({ name: 'id', type: String })
  async pauseJobPosting(@Param('id', ParseUUIDPipe) id: string) {
    const posting = await this.jobPostingService.pauseJobPosting(id);
    return {
      success: true,
      data: posting,
      message: 'Job posting paused successfully',
    };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a job posting' })
  @ApiParam({ name: 'id', type: String })
  async closeJobPosting(@Param('id', ParseUUIDPipe) id: string) {
    const posting = await this.jobPostingService.closeJobPosting(id);
    return {
      success: true,
      data: posting,
      message: 'Job posting closed successfully',
    };
  }

  // ===========================================================================
  // Application Endpoints
  // ===========================================================================

  @Post(':id/apply')
  @ApiOperation({ summary: 'Submit application for a job posting' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Application submitted' })
  async applyToJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Omit<SubmitApplicationDto, 'job_posting_id'>,
  ) {
    const application = await this.jobPostingService.submitApplication({
      ...dto,
      job_posting_id: id,
    });
    return {
      success: true,
      data: application,
      message: 'Application submitted successfully',
    };
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'List applications for a job posting' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: ApplicationStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.jobPostingService.listApplications(
      { job_posting_id: id, status },
      +page,
      +limit,
    );
    return {
      success: true,
      ...result,
    };
  }
}

@ApiTags('Job Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationController {
  constructor(private readonly jobPostingService: JobPostingService) {}

  @Get()
  @ApiOperation({ summary: 'List applications for a caregiver' })
  @ApiQuery({ name: 'caregiver_id', required: true })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listMyApplications(
    @Query('caregiver_id') caregiverId: string,
    @Query('status') status?: ApplicationStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.jobPostingService.listApplications(
      { caregiver_id: caregiverId, status },
      +page,
      +limit,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiParam({ name: 'id', type: String })
  async getApplication(@Param('id', ParseUUIDPipe) id: string) {
    const application = await this.jobPostingService.getApplicationById(id);
    return {
      success: true,
      data: application,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update application status (agency)' })
  @ApiParam({ name: 'id', type: String })
  async updateApplicationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: ApplicationStatus; user_id: string; notes?: string; rejection_reason?: string },
  ) {
    const application = await this.jobPostingService.updateApplicationStatus(
      id,
      body.status,
      body.user_id,
      body.notes,
      body.rejection_reason,
    );
    return {
      success: true,
      data: application,
      message: 'Application status updated',
    };
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw application (caregiver)' })
  @ApiParam({ name: 'id', type: String })
  async withdrawApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { caregiver_id: string },
  ) {
    const application = await this.jobPostingService.withdrawApplication(id, body.caregiver_id);
    return {
      success: true,
      data: application,
      message: 'Application withdrawn successfully',
    };
  }

  @Patch(':id/match-score')
  @ApiOperation({ summary: 'Set AI match score for application' })
  @ApiParam({ name: 'id', type: String })
  async setMatchScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { match_score: number; match_factors: Record<string, unknown> },
  ) {
    const application = await this.jobPostingService.setMatchScore(
      id,
      body.match_score,
      body.match_factors as any,
    );
    return {
      success: true,
      data: application,
    };
  }
}

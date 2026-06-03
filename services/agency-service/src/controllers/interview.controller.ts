import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  InterviewService,
  ScheduleInterviewDto,
  RescheduleInterviewDto,
  SubmitFeedbackDto,
} from '../services/interview.service';
import { InterviewStatus } from '../entities/agency-interview.entity';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a new interview' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Interview scheduled successfully' })
  async scheduleInterview(@Body() dto: ScheduleInterviewDto) {
    const interview = await this.interviewService.scheduleInterview(dto);
    return {
      success: true,
      data: interview,
      message: 'Interview scheduled successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List interviews with filters' })
  @ApiQuery({ name: 'agency_id', required: false })
  @ApiQuery({ name: 'interviewer_user_id', required: false })
  @ApiQuery({ name: 'application_id', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InterviewStatus })
  @ApiQuery({ name: 'from_date', required: false })
  @ApiQuery({ name: 'to_date', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listInterviews(
    @Query('agency_id') agencyId?: string,
    @Query('interviewer_user_id') interviewerUserId?: string,
    @Query('application_id') applicationId?: string,
    @Query('status') status?: InterviewStatus,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.interviewService.listInterviews(
      {
        agency_id: agencyId,
        interviewer_user_id: interviewerUserId,
        application_id: applicationId,
        status,
        from_date: fromDate ? new Date(fromDate) : undefined,
        to_date: toDate ? new Date(toDate) : undefined,
      },
      +page,
      +limit,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming interviews for a user' })
  @ApiQuery({ name: 'user_id', required: true })
  @ApiQuery({ name: 'role', required: true, enum: ['interviewer', 'candidate'] })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUpcomingInterviews(
    @Query('user_id') userId: string,
    @Query('role') role: 'interviewer' | 'candidate',
    @Query('days') days = 7,
  ) {
    const interviews = await this.interviewService.getUpcomingInterviews(userId, role, +days);
    return {
      success: true,
      data: interviews,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interview by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Interview retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Interview not found' })
  async getInterview(@Param('id', ParseUUIDPipe) id: string) {
    const interview = await this.interviewService.getInterviewById(id);
    return {
      success: true,
      data: interview,
    };
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an interview' })
  @ApiParam({ name: 'id', type: String })
  async confirmInterview(@Param('id', ParseUUIDPipe) id: string) {
    const interview = await this.interviewService.confirmInterview(id);
    return {
      success: true,
      data: interview,
      message: 'Interview confirmed successfully',
    };
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an interview' })
  @ApiParam({ name: 'id', type: String })
  async rescheduleInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleInterviewDto,
  ) {
    const interview = await this.interviewService.rescheduleInterview(id, dto);
    return {
      success: true,
      data: interview,
      message: 'Interview rescheduled successfully',
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an interview' })
  @ApiParam({ name: 'id', type: String })
  async cancelInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { cancelled_by: string; reason?: string },
  ) {
    const interview = await this.interviewService.cancelInterview(id, body.cancelled_by, body.reason);
    return {
      success: true,
      data: interview,
      message: 'Interview cancelled successfully',
    };
  }

  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark interview as no-show' })
  @ApiParam({ name: 'id', type: String })
  async markNoShow(@Param('id', ParseUUIDPipe) id: string) {
    const interview = await this.interviewService.markNoShow(id);
    return {
      success: true,
      data: interview,
      message: 'Interview marked as no-show',
    };
  }

  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit interview feedback' })
  @ApiParam({ name: 'id', type: String })
  async submitFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    const interview = await this.interviewService.submitFeedback(id, dto);
    return {
      success: true,
      data: interview,
      message: 'Interview feedback submitted successfully',
    };
  }

  @Post(':id/reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send interview reminder' })
  @ApiParam({ name: 'id', type: String })
  async sendReminder(@Param('id', ParseUUIDPipe) id: string) {
    const interview = await this.interviewService.sendReminder(id);
    return {
      success: true,
      data: interview,
      message: 'Reminder sent successfully',
    };
  }
}

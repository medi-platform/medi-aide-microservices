import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FeedbackRequestService } from '../services/feedback-request.service';

/**
 * Feedback Request Controller
 * Phase 5G: Manage feedback requests and reminders
 */
@ApiTags('Feedback Requests')
@Controller('feedback-requests')
export class FeedbackRequestController {
  constructor(private readonly requestService: FeedbackRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a feedback request' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async createRequest(@Body() dto: {
    surveyId: string;
    recipientId: string;
    recipientType: 'patient' | 'caregiver' | 'family' | 'agency';
    recipientEmail?: string;
    recipientPhone?: string;
    contextType?: 'visit' | 'shift' | 'contract' | 'onboarding' | 'general';
    contextId?: string;
    contextData?: Record<string, any>;
    expiresInDays?: number;
  }) {
    return this.requestService.createRequest(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback request by ID' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async getRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestService.getRequest(id);
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Get feedback request by token' })
  @ApiParam({ name: 'token', description: 'Request token' })
  async getByToken(@Param('token') token: string) {
    return this.requestService.getByToken(token);
  }

  @Put(':id/sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark request as sent' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async markAsSent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { sentVia: 'email' | 'sms' | 'push' | 'in_app' },
  ) {
    return this.requestService.markAsSent(id, dto.sentVia);
  }

  @Put(':id/opened')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark request as opened' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async markAsOpened(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestService.markAsOpened(id);
  }

  @Put(':id/started')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark request as started' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async markAsStarted(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestService.markAsStarted(id);
  }

  @Put(':id/completed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark request as completed' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async markAsCompleted(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { responseId: string },
  ) {
    return this.requestService.markAsCompleted(id, dto.responseId);
  }

  @Put(':id/declined')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark request as declined' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async markAsDeclined(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestService.markAsDeclined(id);
  }

  @Get('recipient/:recipientId/pending')
  @ApiOperation({ summary: 'Get pending requests for a recipient' })
  @ApiParam({ name: 'recipientId', description: 'Recipient ID' })
  async getPendingRequests(@Param('recipientId', ParseUUIDPipe) recipientId: string) {
    return this.requestService.getPendingRequests(recipientId);
  }
}

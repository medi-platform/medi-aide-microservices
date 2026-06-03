import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ReportSubscriptionService } from '../services/report-subscription.service';
import { OutputFormat } from '../entities/report-definition.entity';

/**
 * Report Subscription Controller
 * Phase 5H: Manage user subscriptions to scheduled reports
 */
@ApiTags('Report Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: ReportSubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Subscribe to a scheduled report' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async subscribe(@Body() dto: {
    userId: string;
    scheduleId: string;
    preferredFormat?: OutputFormat;
    email?: string;
    notifyOnCompletion?: boolean;
    notifyOnFailure?: boolean;
    includeAttachment?: boolean;
    includeDownloadLink?: boolean;
  }) {
    return this.subscriptionService.subscribe(dto);
  }

  @Delete('user/:userId/schedule/:scheduleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from a scheduled report' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  async unsubscribe(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ) {
    return this.subscriptionService.unsubscribe(userId, scheduleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.getSubscription(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription preferences' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      preferredFormat?: OutputFormat;
      email?: string;
      notifyOnCompletion?: boolean;
      notifyOnFailure?: boolean;
      includeAttachment?: boolean;
      includeDownloadLink?: boolean;
    },
  ) {
    return this.subscriptionService.updateSubscription(id, dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserSubscriptions(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.subscriptionService.getUserSubscriptions(userId);
  }

  @Get('schedule/:scheduleId/subscribers')
  @ApiOperation({ summary: 'Get schedule subscribers' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  async getScheduleSubscribers(@Param('scheduleId', ParseUUIDPipe) scheduleId: string) {
    return this.subscriptionService.getScheduleSubscribers(scheduleId);
  }

  @Get('schedule/:scheduleId/stats')
  @ApiOperation({ summary: 'Get subscription statistics for schedule' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  async getSubscriptionStats(@Param('scheduleId', ParseUUIDPipe) scheduleId: string) {
    return this.subscriptionService.getSubscriptionStats(scheduleId);
  }
}

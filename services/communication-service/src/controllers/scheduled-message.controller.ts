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
import { ScheduledMessageService } from '../services/scheduled-message.service';
import { MessageType } from '../interfaces/communication.interface';

/**
 * Scheduled Message Controller
 * Phase 5F: Schedule messages for later delivery
 */
@ApiTags('Scheduled Messages')
@Controller('scheduled-messages')
export class ScheduledMessageController {
  constructor(private readonly scheduledService: ScheduledMessageService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a message for later' })
  @ApiResponse({ status: 201, description: 'Message scheduled' })
  async scheduleMessage(@Body() dto: {
    conversationId: string;
    senderId: string;
    type?: MessageType;
    content?: string;
    attachments?: any[];
    scheduledAt: Date;
    isRecurring?: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly';
    recurrenceEndDate?: Date;
    timezone?: string;
  }) {
    return this.scheduledService.scheduleMessage(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scheduled message by ID' })
  @ApiParam({ name: 'id', description: 'Scheduled Message ID' })
  async getScheduledMessage(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduledService.getScheduledMessage(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update scheduled message' })
  @ApiParam({ name: 'id', description: 'Scheduled Message ID' })
  async updateScheduledMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      content?: string;
      attachments?: any[];
      scheduledAt?: Date;
      isRecurring?: boolean;
      recurrencePattern?: 'daily' | 'weekly' | 'monthly';
      recurrenceEndDate?: Date;
    },
  ) {
    return this.scheduledService.updateScheduledMessage(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel scheduled message' })
  @ApiParam({ name: 'id', description: 'Scheduled Message ID' })
  async cancelScheduledMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { cancelledBy: string },
  ) {
    return this.scheduledService.cancelScheduledMessage(id, dto.cancelledBy);
  }

  @Get('user/:senderId')
  @ApiOperation({ summary: 'Get user scheduled messages' })
  @ApiParam({ name: 'senderId', description: 'Sender ID' })
  async getUserScheduledMessages(@Param('senderId', ParseUUIDPipe) senderId: string) {
    return this.scheduledService.getUserScheduledMessages(senderId);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get conversation scheduled messages' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  async getConversationScheduledMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.scheduledService.getConversationScheduledMessages(conversationId);
  }
}

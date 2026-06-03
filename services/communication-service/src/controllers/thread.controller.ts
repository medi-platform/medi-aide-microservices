import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ThreadService } from '../services/thread.service';

/**
 * Thread Controller
 * Phase 5F: Message threading for organized discussions
 */
@ApiTags('Message Threads')
@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  @ApiOperation({ summary: 'Create a message thread' })
  @ApiResponse({ status: 201, description: 'Thread created' })
  async createThread(@Body() dto: { conversationId: string; parentMessageId: string }) {
    return this.threadService.createThread(dto.conversationId, dto.parentMessageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get thread by ID' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async getThread(@Param('id', ParseUUIDPipe) id: string) {
    return this.threadService.getThread(id);
  }

  @Get('message/:parentMessageId')
  @ApiOperation({ summary: 'Get thread by parent message ID' })
  @ApiParam({ name: 'parentMessageId', description: 'Parent Message ID' })
  async getThreadByParentMessage(@Param('parentMessageId', ParseUUIDPipe) parentMessageId: string) {
    return this.threadService.getThreadByParentMessage(parentMessageId);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get thread replies' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async getThreadReplies(@Param('id', ParseUUIDPipe) id: string) {
    return this.threadService.getThreadReplies(id);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark thread as resolved' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async resolveThread(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { resolvedBy: string },
  ) {
    return this.threadService.markThreadResolved(id, dto.resolvedBy);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen a resolved thread' })
  @ApiParam({ name: 'id', description: 'Thread ID' })
  async reopenThread(@Param('id', ParseUUIDPipe) id: string) {
    return this.threadService.reopenThread(id);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get all threads in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  async getConversationThreads(@Param('conversationId', ParseUUIDPipe) conversationId: string) {
    return this.threadService.getConversationThreads(conversationId);
  }

  @Get('conversation/:conversationId/active')
  @ApiOperation({ summary: 'Get active (unresolved) threads in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  async getActiveThreads(@Param('conversationId', ParseUUIDPipe) conversationId: string) {
    return this.threadService.getActiveThreads(conversationId);
  }
}

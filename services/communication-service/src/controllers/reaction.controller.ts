import {
  Controller,
  Get,
  Post,
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
import { ReactionService } from '../services/reaction.service';

/**
 * Reaction Controller
 * Phase 5F: Message reactions (emoji) management
 */
@ApiTags('Message Reactions')
@Controller('reactions')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post('messages/:messageId')
  @ApiOperation({ summary: 'Add reaction to a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  async addReaction(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: { userId: string; userName?: string; reaction: string },
  ) {
    return this.reactionService.addReaction(
      messageId,
      dto.userId,
      dto.userName || '',
      dto.reaction,
    );
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove reaction from a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async removeReaction(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: { userId: string; reaction: string },
  ) {
    await this.reactionService.removeReaction(messageId, dto.userId, dto.reaction);
  }

  @Get('messages/:messageId')
  @ApiOperation({ summary: 'Get all reactions for a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async getMessageReactions(@Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.reactionService.getMessageReactions(messageId);
  }

  @Get('messages/:messageId/summary')
  @ApiOperation({ summary: 'Get reaction summary for a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async getReactionSummary(@Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.reactionService.getReactionSummary(messageId);
  }
}

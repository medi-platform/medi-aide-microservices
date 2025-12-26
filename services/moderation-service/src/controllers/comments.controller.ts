import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Comments Controller
 * Manages comments, reactions, and user-generated content moderation.
 */
@ApiTags('Comments')
@Controller('comments')
export class CommentsController {

  @Get()
  @ApiOperation({ summary: 'Get comments for an entity' })
  async getComments(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return { entityType, entityId, comments: [], total: 0 };
  }

  @Post()
  @ApiOperation({ summary: 'Add comment' })
  async addComment(@Body() dto: { entityType: string; entityId: string; authorId: string; content: string }) {
    return { id: `cmt_${Date.now()}`, ...dto, createdAt: new Date().toISOString(), status: 'visible' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit comment' })
  async editComment(@Param('id') id: string, @Body() dto: { content: string }) {
    return { id, content: dto.content, editedAt: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report comment' })
  async reportComment(@Param('id') id: string, @Body() dto: { reporterId: string; reason: string }) {
    return { id, reported: true, reportId: `rpt_${Date.now()}` };
  }

  @Post(':id/reactions')
  @ApiOperation({ summary: 'Add reaction to comment' })
  async addReaction(@Param('id') id: string, @Body() dto: { userId: string; reaction: string }) {
    return { id, userId: dto.userId, reaction: dto.reaction, addedAt: new Date().toISOString() };
  }

  @Delete(':id/reactions/:userId')
  @ApiOperation({ summary: 'Remove reaction' })
  async removeReaction(@Param('id') id: string, @Param('userId') userId: string) {
    return { id, userId, removed: true };
  }
}


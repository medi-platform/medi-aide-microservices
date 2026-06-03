import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TemplateService } from '../services/template.service';
import { TemplateCategory } from '../entities/message-template.entity';
import { MessageType } from '../interfaces/communication.interface';

/**
 * Template Controller
 * Phase 5F: Reusable message templates
 */
@ApiTags('Message Templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a message template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Body() dto: {
    ownerId?: string;
    isSystem?: boolean;
    name: string;
    description?: string;
    category?: TemplateCategory;
    messageType?: MessageType;
    content: string;
    contentFr?: string;
    placeholders?: { key: string; label: string; description?: string; defaultValue?: string; required?: boolean }[];
    shortcut?: string;
    attachmentTemplates?: { type: string; url: string; fileName: string }[];
  }) {
    return this.templateService.createTemplate(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async getTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.getTemplate(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      category?: TemplateCategory;
      content?: string;
      contentFr?: string;
      placeholders?: any[];
      shortcut?: string;
      attachmentTemplates?: any[];
    },
  ) {
    return this.templateService.updateTemplate(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async publishTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.publishTemplate(id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async archiveTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.archiveTemplate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    await this.templateService.deleteTemplate(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user templates' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'category', required: false, enum: TemplateCategory })
  async getUserTemplates(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('category') category?: TemplateCategory,
  ) {
    return this.templateService.getUserTemplates(userId, category);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system templates' })
  @ApiQuery({ name: 'category', required: false, enum: TemplateCategory })
  async getSystemTemplates(@Query('category') category?: TemplateCategory) {
    return this.templateService.getSystemTemplates(category);
  }

  @Get('shortcut/:shortcut')
  @ApiOperation({ summary: 'Find template by shortcut' })
  @ApiParam({ name: 'shortcut', description: 'Template shortcut' })
  async findByShortcut(@Param('shortcut') shortcut: string) {
    return this.templateService.findByShortcut(shortcut);
  }

  @Post(':id/render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Render template with data' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async renderTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { data: Record<string, string>; locale?: 'en' | 'fr' },
  ) {
    const content = await this.templateService.renderTemplate(id, dto.data, dto.locale);
    return { content };
  }

  @Post(':id/use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark template as used (increment counter)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async useTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.useTemplate(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search templates' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'userId', required: false })
  async searchTemplates(
    @Query('query') query: string,
    @Query('userId') userId?: string,
  ) {
    return this.templateService.searchTemplates(query, userId);
  }
}

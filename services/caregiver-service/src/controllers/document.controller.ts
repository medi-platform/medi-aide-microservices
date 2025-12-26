import { 
  Controller, Get, Post, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';

@Controller('caregivers/:caregiverId/documents')
@ApiTags('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: 'Get caregiver documents' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getDocuments(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('type') type?: string,
    @Query('status') status?: string
  ) {
    return this.documentService.getDocuments(caregiverId, type, status);
  }

  @Post()
  @ApiOperation({ summary: 'Upload document' })
  async uploadDocument(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: any
  ) {
    return this.documentService.uploadDocument(caregiverId, dto);
  }

  @Get(':docId')
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('docId', ParseUUIDPipe) docId: string
  ) {
    return this.documentService.getDocument(caregiverId, docId);
  }

  @Delete(':docId')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('docId', ParseUUIDPipe) docId: string
  ) {
    return this.documentService.deleteDocument(caregiverId, docId);
  }

  @Patch(':docId/verify')
  @ApiOperation({ summary: 'Verify document' })
  async verifyDocument(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() dto: { verified: boolean; notes?: string }
  ) {
    return this.documentService.verifyDocument(caregiverId, docId, dto);
  }

  @Get('required')
  @ApiOperation({ summary: 'Get required documents status' })
  async getRequiredDocuments(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.documentService.getRequiredDocuments(caregiverId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring documents' })
  async getExpiring(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('days') days: number = 30
  ) {
    return this.documentService.getExpiring(caregiverId, days);
  }
}


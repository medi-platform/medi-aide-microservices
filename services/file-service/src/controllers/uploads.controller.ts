import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FileService } from '../services/file.service';
import { FileCategory, AccessLevel } from '../interfaces/file.interface';

class InitiateUploadDto {
  fileName!: string;
  mimeType!: string;
  size!: number;
  category!: FileCategory;
  ownerId!: string;
  ownerType!: 'user' | 'caregiver' | 'patient' | 'agency' | 'visit';
  metadata?: Record<string, unknown>;
  accessLevel?: AccessLevel;
}

class ConfirmUploadDto {
  checksum?: string;
}

class UpdateMetadataDto {
  metadata?: Record<string, unknown>;
  tags?: string[];
}

class ShareFileDto {
  accessLevel!: AccessLevel;
}

@Controller('files')
@ApiTags('files')
export class UploadsController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate file upload and get presigned URL' })
  @ApiResponse({ status: 201, description: 'Upload initiated' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async initiateUpload(@Body() dto: InitiateUploadDto) {
    return this.fileService.initiateUpload(dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm upload completed' })
  @ApiResponse({ status: 200, description: 'Upload confirmed' })
  async confirmUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.fileService.confirmUpload(id, dto.checksum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({ status: 200, description: 'File details' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.getById(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get presigned download URL' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  @ApiResponse({ status: 403, description: 'File not available' })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.fileService.getDownloadUrl(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 204, description: 'File deleted' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    await this.fileService.delete(id, userId);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get files by owner' })
  @ApiQuery({ name: 'ownerType', required: true })
  @ApiQuery({ name: 'category', required: false })
  async getByOwner(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Query('ownerType') ownerType: string,
    @Query('category') category?: FileCategory,
  ) {
    return this.fileService.getByOwner(ownerId, ownerType, category);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get file access logs' })
  async getAccessLogs(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.getAccessLogs(id);
  }

  @Post(':id/metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update file metadata' })
  async updateMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMetadataDto,
  ) {
    return this.fileService.updateMetadata(id, dto.metadata || {}, dto.tags);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Share file / update access level' })
  async shareFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareFileDto,
    @Query('userId') userId?: string,
  ) {
    return this.fileService.shareFile(id, dto.accessLevel, userId);
  }
}

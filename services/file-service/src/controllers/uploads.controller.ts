import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, IsMimeType, Min } from 'class-validator';

class InitUploadDto {
  @IsUUID()
  userId!: string;

  @IsString()
  fileName!: string;

  @IsString()
  @IsMimeType()
  mimeType!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

class FinalizeUploadDto {
  @IsUUID()
  userId!: string;

  @IsString()
  uploadId!: string;

  @IsOptional()
  uploadMetadata?: Record<string, any>;
}

@Controller('uploads')
export class UploadsController {
  @Post('init')
  @HttpCode(HttpStatus.OK)
  init(@Body() dto: InitUploadDto) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const uploadId = cryptoRandomId();
    return {
      uploadId,
      uploadUrl: `/internal/upload/${uploadId}`,
      uploadFields: {},
      expiresAt,
      maxSize: Math.min(50 * 1024 * 1024, dto.fileSize * 2),
      allowedTypes: [dto.mimeType],
    };
  }

  @Post('finalize')
  finalize(@Body() dto: FinalizeUploadDto) {
    return { status: 'completed' };
  }
}

@Controller('downloads')
export class DownloadsController {
  @Get('url')
  url(@Query('key') key: string) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const url = `/internal/download/${encodeURIComponent(key)}`;
    return { url, expiresAt };
  }
}

function cryptoRandomId(): string {
  // Avoid importing crypto to keep image slimmer; pseudo-random is fine for placeholder
  return 'upl_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}



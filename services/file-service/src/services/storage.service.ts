import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Storage Service
 * Handles S3/MinIO storage operations
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly provider: string;
  private readonly presignedUrlExpiry: number;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.bucket', 'medi-aide-files');
    this.region = this.configService.get<string>('storage.region', 'ca-central-1');
    this.provider = this.configService.get<string>('storage.provider', 's3');
    this.presignedUrlExpiry = this.configService.get<number>('storage.presignedUrlExpiry', 3600);
  }

  /**
   * Generate a presigned upload URL
   */
  async getUploadUrl(
    key: string,
    mimeType: string,
    expiresIn?: number,
  ): Promise<{ uploadUrl: string; fields?: Record<string, string>; expiresAt: Date }> {
    const expiry = expiresIn || this.presignedUrlExpiry;
    const expiresAt = new Date(Date.now() + expiry * 1000);

    // In production, use AWS SDK v3:
    // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    // import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
    
    // For now, return a mock URL structure
    const uploadUrl = this.buildMockPresignedUrl(key, 'PUT', expiry);

    this.logger.log(`Generated upload URL for ${key}`);

    return {
      uploadUrl,
      expiresAt,
    };
  }

  /**
   * Generate a presigned download URL
   */
  async getDownloadUrl(
    key: string,
    expiresIn?: number,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const expiry = expiresIn || this.presignedUrlExpiry;
    const expiresAt = new Date(Date.now() + expiry * 1000);

    const downloadUrl = this.buildMockPresignedUrl(key, 'GET', expiry);

    this.logger.log(`Generated download URL for ${key}`);

    return {
      downloadUrl,
      expiresAt,
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    // In production, use AWS SDK:
    // await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    
    this.logger.log(`Deleted file: ${key}`);
  }

  /**
   * Copy a file within storage
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    // In production, use AWS SDK:
    // await this.s3Client.send(new CopyObjectCommand({...}));
    
    this.logger.log(`Copied file from ${sourceKey} to ${destinationKey}`);
  }

  /**
   * Generate storage key for a file
   */
  generateStorageKey(
    ownerId: string,
    ownerType: string,
    category: string,
    fileName: string,
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `${ownerType}/${ownerId}/${category}/${year}/${month}/${uniqueId}-${sanitizedName}`;
  }

  /**
   * Calculate file checksum
   */
  calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number, maxSizeMB?: number): void {
    const maxSize = (maxSizeMB || this.configService.get<number>('upload.maxFileSizeMB', 50)) * 1024 * 1024;
    if (size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed (${maxSizeMB || 50}MB)`);
    }
  }

  /**
   * Validate mime type
   */
  validateMimeType(mimeType: string): void {
    const allowedTypes = this.configService.get<string[]>('upload.allowedMimeTypes', []);
    if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} is not allowed`);
    }
  }

  /**
   * Build mock presigned URL (replace with actual SDK in production)
   */
  private buildMockPresignedUrl(key: string, method: string, expiry: number): string {
    const endpoint = this.configService.get<string>('storage.endpoint');
    const baseUrl = endpoint || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + expiry;
    
    return `${baseUrl}/${key}?X-Amz-Expires=${expiry}&X-Amz-Date=${new Date().toISOString()}&method=${method}`;
  }
}

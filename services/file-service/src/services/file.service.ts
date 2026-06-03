import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { File } from '../entities/file.entity';
import { FileAccessLog } from '../entities/file-access-log.entity';
import {
  FileCategory,
  FileStatus,
  AccessLevel,
  FileUploadRequest,
  FileUploadResult,
  FileDownloadResult,
} from '../interfaces/file.interface';
import { StorageService } from './storage.service';

/**
 * File Service
 * Core business logic for file management
 */
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    @InjectRepository(FileAccessLog)
    private readonly accessLogRepo: Repository<FileAccessLog>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initiate file upload
   */
  async initiateUpload(request: FileUploadRequest): Promise<FileUploadResult> {
    // Validate file
    this.storageService.validateFileSize(request.size);
    this.storageService.validateMimeType(request.mimeType);

    // Generate storage key
    const storagePath = this.storageService.generateStorageKey(
      request.ownerId,
      request.ownerType,
      request.category,
      request.fileName,
    );

    // Create file record
    const file = this.fileRepo.create({
      originalName: request.fileName,
      storagePath,
      mimeType: request.mimeType,
      size: request.size,
      category: request.category,
      status: FileStatus.PENDING,
      accessLevel: request.accessLevel || AccessLevel.PRIVATE,
      ownerId: request.ownerId,
      ownerType: request.ownerType,
      metadata: request.metadata,
      expiresAt: request.expiresAt,
    });

    const savedFile = await this.fileRepo.save(file);

    // Get presigned upload URL
    const { uploadUrl, expiresAt } = await this.storageService.getUploadUrl(
      storagePath,
      request.mimeType,
    );

    await this.logAccess(savedFile.id, undefined, 'upload', true);

    return {
      fileId: savedFile.id,
      uploadUrl,
      expiresAt,
    };
  }

  /**
   * Confirm upload completed and trigger scan
   */
  async confirmUpload(fileId: string, checksum?: string): Promise<File> {
    const file = await this.getById(fileId);

    if (file.status !== FileStatus.PENDING) {
      throw new ForbiddenException('File upload already confirmed');
    }

    file.status = FileStatus.SCANNING;
    if (checksum) {
      file.checksum = checksum;
    }

    const saved = await this.fileRepo.save(file);

    // TODO: Trigger virus scan asynchronously
    // For now, mark as active
    saved.status = FileStatus.ACTIVE;
    saved.isScanned = true;
    saved.isSafe = true;
    saved.scannedAt = new Date();

    return this.fileRepo.save(saved);
  }

  /**
   * Get file by ID
   */
  async getById(id: string): Promise<File> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File ${id} not found`);
    }
    return file;
  }

  /**
   * Get download URL
   */
  async getDownloadUrl(fileId: string, userId?: string): Promise<FileDownloadResult> {
    const file = await this.getById(fileId);

    if (file.status !== FileStatus.ACTIVE) {
      throw new ForbiddenException('File is not available for download');
    }

    if (!file.isSafe) {
      throw new ForbiddenException('File failed security scan');
    }

    const result = await this.storageService.getDownloadUrl(file.storagePath);

    // Update access stats
    file.downloadCount++;
    file.lastAccessedAt = new Date();
    await this.fileRepo.save(file);

    await this.logAccess(fileId, userId, 'download', true);

    return result;
  }

  /**
   * Delete a file (soft delete)
   */
  async delete(fileId: string, userId?: string): Promise<void> {
    const file = await this.getById(fileId);

    file.status = FileStatus.DELETED;
    file.deletedAt = new Date();
    await this.fileRepo.save(file);

    // Schedule actual deletion from storage
    // await this.storageService.deleteFile(file.storagePath);

    await this.logAccess(fileId, userId, 'delete', true);
    this.logger.log(`File ${fileId} marked as deleted`);
  }

  /**
   * Get files by owner
   */
  async getByOwner(
    ownerId: string,
    ownerType: string,
    category?: FileCategory,
  ): Promise<File[]> {
    const where: Record<string, unknown> = {
      ownerId,
      ownerType,
      status: In([FileStatus.ACTIVE, FileStatus.PENDING]),
    };

    if (category) {
      where.category = category;
    }

    return this.fileRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get file access logs
   */
  async getAccessLogs(fileId: string): Promise<FileAccessLog[]> {
    return this.accessLogRepo.find({
      where: { fileId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update file metadata
   */
  async updateMetadata(
    fileId: string,
    metadata: Record<string, unknown>,
    tags?: string[],
  ): Promise<File> {
    const file = await this.getById(fileId);
    
    file.metadata = { ...file.metadata, ...metadata };
    if (tags) {
      file.tags = tags;
    }

    return this.fileRepo.save(file);
  }

  /**
   * Share file (update access level)
   */
  async shareFile(
    fileId: string,
    accessLevel: AccessLevel,
    userId?: string,
  ): Promise<File> {
    const file = await this.getById(fileId);
    file.accessLevel = accessLevel;
    
    await this.logAccess(fileId, userId, 'share', true, { accessLevel });
    
    return this.fileRepo.save(file);
  }

  /**
   * Log file access
   */
  private async logAccess(
    fileId: string,
    userId?: string,
    action?: 'view' | 'download' | 'delete' | 'share' | 'upload' | 'scan',
    success: boolean = true,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const log = this.accessLogRepo.create({
      fileId,
      userId,
      action: action || 'view',
      success,
      details,
    });
    await this.accessLogRepo.save(log);
  }
}

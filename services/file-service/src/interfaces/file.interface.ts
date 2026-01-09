/**
 * File Service Interfaces
 */

export enum FileCategory {
  DOCUMENT = 'document',
  IMAGE = 'image',
  MEDICAL = 'medical',
  CERTIFICATION = 'certification',
  CONTRACT = 'contract',
  IDENTIFICATION = 'identification',
  SIGNATURE = 'signature',
  PHOTO = 'photo',
  REPORT = 'report',
  OTHER = 'other',
}

export enum FileStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  ACTIVE = 'active',
  QUARANTINED = 'quarantined',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
}

export enum AccessLevel {
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  SHARED = 'shared',
  PUBLIC = 'public',
}

export interface FileUploadRequest {
  fileName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  ownerId: string;
  ownerType: 'user' | 'caregiver' | 'patient' | 'agency' | 'visit';
  metadata?: Record<string, unknown>;
  accessLevel?: AccessLevel;
  expiresAt?: Date;
}

export interface FileUploadResult {
  fileId: string;
  uploadUrl: string;
  fields?: Record<string, string>;
  expiresAt: Date;
}

export interface FileDownloadResult {
  downloadUrl: string;
  expiresAt: Date;
}

export interface FileScanResult {
  isClean: boolean;
  threatName?: string;
  scannerVersion?: string;
  scannedAt: Date;
}

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  category: FileCategory;
  tags?: string[];
  customMetadata?: Record<string, unknown>;
}

export interface FileAccessLog {
  fileId: string;
  userId: string;
  action: 'view' | 'download' | 'delete' | 'share';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

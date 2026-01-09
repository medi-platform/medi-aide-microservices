import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FileCategory, FileStatus, AccessLevel } from '../interfaces/file.interface';

/**
 * File Entity
 * Core entity for file metadata storage
 */
@Entity('files')
@Index(['ownerId', 'ownerType'])
@Index(['category', 'status'])
@Index(['status', 'createdAt'])
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 500 })
  storagePath!: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  @Column({
    type: 'enum',
    enum: FileCategory,
    default: FileCategory.OTHER,
  })
  category!: FileCategory;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status!: FileStatus;

  @Column({
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.PRIVATE,
  })
  accessLevel!: AccessLevel;

  @Column({ type: 'uuid' })
  @Index()
  ownerId!: string;

  @Column({ type: 'varchar', length: 50 })
  ownerType!: string;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'boolean', default: false })
  isEncrypted!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  encryptionKeyId?: string;

  @Column({ type: 'boolean', default: false })
  isScanned!: boolean;

  @Column({ type: 'boolean', default: true })
  isSafe!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  threatName?: string;

  @Column({ type: 'timestamptz', nullable: true })
  scannedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'int', default: 0 })
  downloadCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

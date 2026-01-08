import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ConsentType } from '../enums/recommendation-type.enum';

@Entity('wellness_user_consents')
@Index(['userId', 'consentType'], { unique: true })
export class UserConsent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'consent_type', type: 'enum', enum: ConsentType })
  consentType!: ConsentType;

  @Column({ default: false })
  granted!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'v1' })
  version!: string;

  @Column({ type: 'timestamptz', name: 'granted_at', nullable: true })
  grantedAt?: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


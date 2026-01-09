import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * SSO Strategy
 */
export enum SSOStrategy {
  SAML = 'saml',
  OIDC = 'oidc',
}

/**
 * AgencySSOSettings Entity
 * 
 * Stores Single Sign-On configuration for enterprise agencies.
 * Supports SAML 2.0 and OpenID Connect (OIDC).
 */
@Entity({ name: 'agency_sso_settings' })
@Index(['agency_id'], { unique: true })
export class AgencySSOSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  strategy?: SSOStrategy;

  // ============================================================================
  // SAML Configuration
  // ============================================================================

  @Column({ type: 'varchar', length: 500, nullable: true })
  saml_metadata_url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  saml_entity_id?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  saml_acs_url?: string;

  @Column({ type: 'text', nullable: true })
  saml_certificate?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  saml_login_url?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  saml_logout_url?: string;

  // ============================================================================
  // OIDC Configuration
  // ============================================================================

  @Column({ type: 'varchar', length: 500, nullable: true })
  oidc_issuer?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oidc_client_id?: string;

  /** Encrypted client secret */
  @Column({ type: 'text', nullable: true })
  oidc_client_secret_encrypted?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  oidc_redirect_uri?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  oidc_authorization_url?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  oidc_token_url?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  oidc_userinfo_url?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  oidc_scopes!: string[];

  // ============================================================================
  // Common Settings
  // ============================================================================

  /** Allowed email domains for SSO users */
  @Column({ type: 'text', array: true, default: '{}' })
  allowed_domains!: string[];

  /** Auto-provision users on first SSO login */
  @Column({ type: 'boolean', default: false })
  auto_provision_users!: boolean;

  /** Default role for auto-provisioned users */
  @Column({ type: 'varchar', length: 50, nullable: true })
  default_role?: string;

  /** Force SSO login (disable password auth) */
  @Column({ type: 'boolean', default: false })
  force_sso!: boolean;

  /** Attribute mapping for user fields */
  @Column({ type: 'jsonb', nullable: true })
  attribute_mapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    groups?: string;
  };

  @Column({ type: 'timestamptz', nullable: true })
  last_used_at?: Date;

  @Column({ type: 'int', default: 0 })
  login_count!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

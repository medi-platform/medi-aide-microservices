import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Language proficiency levels (CEFR scale)
 */
export enum LanguageProficiency {
  BASIC = 'basic', // A1-A2
  CONVERSATIONAL = 'conversational', // B1
  PROFESSIONAL = 'professional', // B2
  FLUENT = 'fluent', // C1
  NATIVE = 'native', // C2
}

/**
 * Entity representing a caregiver's language skills.
 * Important for Canadian bilingual requirements.
 */
@Entity('caregiver_languages')
@Index(['caregiverId'])
@Index(['languageCode', 'proficiency'])
export class CaregiverLanguage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'varchar', length: 10, name: 'language_code' })
  languageCode: string; // ISO 639-1 code (e.g., 'en', 'fr', 'es')

  @Column({ type: 'varchar', length: 100, name: 'language_name' })
  languageName: string;

  @Column({
    type: 'enum',
    enum: LanguageProficiency,
    default: LanguageProficiency.CONVERSATIONAL,
  })
  proficiency: LanguageProficiency;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', name: 'can_read', default: true })
  canRead: boolean;

  @Column({ type: 'boolean', name: 'can_write', default: true })
  canWrite: boolean;

  @Column({ type: 'boolean', name: 'can_speak', default: true })
  canSpeak: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'uuid', name: 'certification_file_id', nullable: true })
  certificationFileId: string;

  @Column({ type: 'varchar', length: 255, name: 'certification_name', nullable: true })
  certificationName: string;

  @Column({ type: 'date', name: 'certification_date', nullable: true })
  certificationDate: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

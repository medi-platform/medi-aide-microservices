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
 * Relationship type to caregiver
 */
export enum EmergencyContactRelationship {
  SPOUSE = 'spouse',
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  FRIEND = 'friend',
  OTHER = 'other',
}

/**
 * Entity representing a caregiver's emergency contact.
 * Required for workplace safety compliance.
 */
@Entity('caregiver_emergency_contacts')
@Index(['caregiverId'])
export class CaregiverEmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: EmergencyContactRelationship,
    default: EmergencyContactRelationship.OTHER,
  })
  relationship: EmergencyContactRelationship;

  @Column({ type: 'varchar', length: 100, name: 'relationship_other', nullable: true })
  relationshipOther: string;

  @Column({ type: 'varchar', length: 20, name: 'phone_primary' })
  phonePrimary: string;

  @Column({ type: 'varchar', length: 20, name: 'phone_secondary', nullable: true })
  phoneSecondary: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 50, name: 'province_code', nullable: true })
  provinceCode: string;

  @Column({ type: 'varchar', length: 10, name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', name: 'contact_order', default: 1 })
  contactOrder: number;

  @Column({ type: 'boolean', name: 'can_make_medical_decisions', default: false })
  canMakeMedicalDecisions: boolean;

  @Column({ type: 'varchar', length: 50, name: 'preferred_language', default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

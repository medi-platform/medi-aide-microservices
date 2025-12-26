import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'family_members' })
@Index(['patient_id'])
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) patient_id!: string;
  @Column() first_name!: string;
  @Column() last_name!: string;
  @Column() relationship!: string;
  @Column({ nullable: true }) phone?: string;
  @Column({ nullable: true }) email?: string;
  @Column({ type: 'boolean', default: false }) is_primary_contact!: boolean;
  @Column({ type: 'boolean', default: false }) is_emergency_contact!: boolean;
  @Column({ type: 'boolean', default: false }) has_care_access!: boolean;
  @CreateDateColumn() created_at!: Date;
}


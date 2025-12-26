import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'emergency_contacts' })
@Index(['patient_id'])
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) patient_id!: string;
  @Column() name!: string;
  @Column() relationship!: string;
  @Column() phone!: string;
  @Column({ nullable: true }) secondary_phone?: string;
  @Column({ type: 'int', default: 1 }) priority!: number;
  @CreateDateColumn() created_at!: Date;
}


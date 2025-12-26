import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'patients' })
@Index(['user_id'])
export class Patient {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) user_id?: string;
  @Column({ nullable: true }) first_name?: string;
  @Column({ nullable: true }) last_name?: string;
  @Column({ type: 'date', nullable: true }) date_of_birth?: Date;
  @Column({ nullable: true }) gender?: string;
  @Column({ nullable: true }) phone?: string;
  @Column({ nullable: true }) email?: string;
  @Column({ nullable: true }) address?: string;
  @Column({ nullable: true }) city?: string;
  @Column({ nullable: true }) province?: string;
  @Column({ nullable: true }) postal_code?: string;
  @Column('text', { array: true, nullable: true }) languages?: string[];
  @Column({ nullable: true }) preferred_language?: string;
  @Column({ nullable: true }) cultural_background?: string;
  @Column('text', { array: true, nullable: true }) care_needs?: string[];
  @Column({ type: 'json', nullable: true }) care_preferences?: Record<string, any>;
  @Column({ type: 'boolean', default: true }) is_active!: boolean;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}


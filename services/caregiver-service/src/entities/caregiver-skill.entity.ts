import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_skills' })
@Index(['caregiver_id', 'skill'], { unique: true })
export class CaregiverSkill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column()
  skill!: string;

  @Column({ nullable: true })
  proficiency_level?: string; // beginner, intermediate, advanced, expert

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'int', default: 0 })
  years_experience!: number;

  @CreateDateColumn()
  created_at!: Date;
}


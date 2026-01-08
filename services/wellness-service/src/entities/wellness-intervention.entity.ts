import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { InterventionType } from '../enums/recommendation-type.enum';

@Entity('wellness_interventions')
@Index(['userId', 'createdAt'])
@Index(['userId', 'status'])
export class WellnessIntervention {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: InterventionType })
  type!: InterventionType;

  @Column({ type: 'varchar', length: 50 })
  trigger!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'delivered' | 'opened' | 'engaged' | 'dismissed' | 'expired';

  @Column({ type: 'varchar', length: 20 })
  priority!: 'low' | 'medium' | 'high' | 'urgent';

  @Column({ type: 'float', name: 'confidence_score', nullable: true })
  confidenceScore?: number;

  @Column({ type: 'timestamptz', name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamptz', name: 'opened_at', nullable: true })
  openedAt?: Date;

  @Column({ type: 'timestamptz', name: 'engaged_at', nullable: true })
  engagedAt?: Date;

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


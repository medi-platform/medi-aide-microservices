import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Matching Metrics Entity
 * 
 * Stores performance metrics for matching operations
 * for SLA monitoring, debugging, and optimization.
 */
@Entity('matching_metrics')
@Index(['careRequestId'])
@Index(['timestamp'])
@Index(['region'])
export class MatchingMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'care_request_id', type: 'uuid' })
  careRequestId!: string;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'int' })
  duration!: number; // milliseconds

  @Column({ name: 'candidate_count', type: 'int', nullable: true })
  candidateCount!: number;

  @Column({ name: 'match_count', type: 'int', nullable: true })
  matchCount!: number;

  @Column({ name: 'top_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  topScore!: number;

  @Column({ name: 'average_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageScore!: number;

  @Column({ name: 'scorer_version', type: 'varchar', length: 50, nullable: true })
  scorerVersion!: string;

  @Column({ name: 'cache_hit', type: 'boolean', default: false })
  cacheHit!: boolean;

  @Column({ name: 'ml_model_used', type: 'boolean', default: false })
  mlModelUsed!: boolean;

  @Column({ name: 'ml_model_version', type: 'varchar', length: 50, nullable: true })
  mlModelVersion!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region!: string;

  @Column({ name: 'h3_cell_id', type: 'varchar', length: 20, nullable: true })
  h3CellId!: string;

  @Column({ name: 'care_type', type: 'varchar', length: 100, nullable: true })
  careType!: string;

  @Column({ type: 'jsonb', nullable: true })
  errors!: string[];

  @Column({ type: 'jsonb', nullable: true })
  scores!: number[];

  @Column({ name: 'sla_met', type: 'boolean', nullable: true })
  slaMet!: boolean;

  @Column({ name: 'sla_target_ms', type: 'int', nullable: true })
  slaTargetMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

















































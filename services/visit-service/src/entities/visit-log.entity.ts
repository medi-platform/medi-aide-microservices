import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Visit Log Entity
 * Audit trail for visit status changes and events
 */
@Entity('visit_logs')
@Index(['visitId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class VisitLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  visitId!: string;

  @Column({ type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  previousStatus?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  newStatus?: string;

  @Column({ type: 'uuid', nullable: true })
  performedBy?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  performedByRole?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}

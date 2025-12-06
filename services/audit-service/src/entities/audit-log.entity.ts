import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['action', 'timestamp'])
@Index(['resourceType', 'resourceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar' })
  action!: string;

  @Column({ type: 'varchar' })
  resourceType!: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  previousState!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newState!: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

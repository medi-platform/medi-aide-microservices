import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RevisionType {
  CREATE = 'create',
  UPDATE = 'update',
  STATUS_CHANGE = 'status_change',
  GOAL_ADDED = 'goal_added',
  GOAL_UPDATED = 'goal_updated',
  GOAL_REMOVED = 'goal_removed',
  ACTIVITY_ADDED = 'activity_added',
  ACTIVITY_UPDATED = 'activity_updated',
  ACTIVITY_REMOVED = 'activity_removed',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',
  APPROVAL = 'approval',
  COMMENT = 'comment',
}

@Entity('care_plan_revisions')
@Index(['carePlanId', 'createdAt'])
@Index(['userId'])
export class CarePlanRevision {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'care_plan_id', type: 'uuid' })
  carePlanId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'user_name', nullable: true })
  userName?: string;

  @Column({ name: 'revision_type', type: 'enum', enum: RevisionType })
  revisionType!: RevisionType;

  // Version number for this revision
  @Column({ type: 'int' })
  version!: number;

  // Summary of what changed
  @Column({ type: 'text' })
  summary!: string;

  // Detailed changes (for undo/redo support)
  @Column({ type: 'jsonb', nullable: true })
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // For CRDT-based collaborative editing
  @Column({ name: 'crdt_state', type: 'bytea', nullable: true })
  crdtState?: Buffer;

  // Related entity (goal, activity, etc.)
  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType?: string;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId?: string;

  // Comment for this revision
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


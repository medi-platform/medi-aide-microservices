import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Message Reaction Entity
 * Phase 5F: Emoji reactions to messages
 */
@Entity('message_reactions')
@Index(['messageId'])
@Index(['userId'])
@Unique(['messageId', 'userId', 'reaction'])
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName?: string;

  @Column({ type: 'varchar', length: 32 })
  reaction!: string; // emoji code e.g., ':thumbsup:', ':heart:', '👍'

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

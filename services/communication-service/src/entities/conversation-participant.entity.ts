import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ParticipantRole } from '../interfaces/communication.interface';

/**
 * Conversation Participant Entity
 * Links users to conversations
 */
@Entity('conversation_participants')
@Index(['conversationId', 'isActive'])
@Index(['userId', 'isActive'])
@Unique(['conversationId', 'userId'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role!: ParticipantRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isMuted!: boolean;

  @Column({ type: 'int', default: 0 })
  unreadCount!: number;

  @Column({ type: 'uuid', nullable: true })
  lastReadMessageId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date;

  @CreateDateColumn()
  joinedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PresenceStatus } from '../interfaces/communication.interface';

/**
 * User Presence Entity
 * Tracks user online status
 */
@Entity('user_presence')
@Index(['userId'], { unique: true })
@Index(['status', 'lastSeenAt'])
export class UserPresence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: PresenceStatus,
    default: PresenceStatus.OFFLINE,
  })
  status!: PresenceStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  statusMessage?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceId?: string;

  @Column({ type: 'timestamptz' })
  lastSeenAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;

  @Column({ type: 'boolean', default: false })
  isTyping!: boolean;

  @Column({ type: 'uuid', nullable: true })
  typingInConversationId?: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}

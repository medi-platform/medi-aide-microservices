import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CoffeeMeetParticipantStatus {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show',
  REMOVED = 'removed',
}

@Entity('coffee_meet_participants')
@Index(['coffeeMeetId', 'userId'], { unique: true })
@Index(['coffeeMeetId', 'status'])
export class CoffeeMeetParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'coffee_meet_id', type: 'uuid' })
  coffeeMeetId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: CoffeeMeetParticipantStatus, default: CoffeeMeetParticipantStatus.ACCEPTED })
  status!: CoffeeMeetParticipantStatus;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}



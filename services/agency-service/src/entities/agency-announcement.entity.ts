import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_announcements' })
@Index(['agency_id'])
export class AgencyAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column()
  priority!: string; // low, normal, high, urgent

  @Column('text', { array: true, nullable: true })
  target_roles?: string[];

  @Column({ type: 'date', nullable: true })
  publish_date?: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_staff' })
@Index(['agency_id', 'user_id'])
export class AgencyStaff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'uuid', nullable: true })
  user_id?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column()
  role!: string; // admin, manager, scheduler, coordinator, billing

  @Column('text', { array: true, default: '{}' })
  permissions!: string[];

  @Column({ default: 'active' })
  status!: string; // active, inactive, pending

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



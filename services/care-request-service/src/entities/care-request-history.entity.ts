import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'care_request_history' })
@Index(['care_request_id'])
export class CareRequestHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) care_request_id!: string;
  @Column() action!: string;
  @Column({ nullable: true }) old_value?: string;
  @Column({ nullable: true }) new_value?: string;
  @Column({ type: 'uuid', nullable: true }) performed_by?: string;
  @CreateDateColumn() created_at!: Date;
}



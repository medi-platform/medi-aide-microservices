import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'claim_line_items' })
@Index(['claim_id'])
export class ClaimLineItem {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) claim_id!: string;
  @Column() procedure_code!: string;
  @Column({ nullable: true }) modifier?: string;
  @Column('text', { nullable: true }) description?: string;
  @Column({ type: 'int', default: 1 }) quantity!: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) unit_price!: number;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) total_price!: number;
  @CreateDateColumn() created_at!: Date;
}


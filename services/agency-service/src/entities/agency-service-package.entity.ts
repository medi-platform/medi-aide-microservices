import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_service_packages' })
@Index(['agency_id'])
export class AgencyServicePackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column('text', { array: true })
  services_included!: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourly_rate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimum_hours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  package_price?: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



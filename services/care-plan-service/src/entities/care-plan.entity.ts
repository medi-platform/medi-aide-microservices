import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('care_plans')
export class CarePlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb' })
  goals!: any[];

  @Column({ type: 'jsonb' })
  interventions!: any[];

  @Column({ type: 'varchar' })
  status!: 'draft' | 'active' | 'completed' | 'archived';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

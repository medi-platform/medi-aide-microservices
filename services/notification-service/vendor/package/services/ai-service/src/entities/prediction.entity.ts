import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('predictions')
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  modelType!: string;

  @Column({ type: 'jsonb' })
  input!: Record<string, any>;

  @Column({ type: 'jsonb' })
  output!: Record<string, any>;

  @Column({ type: 'float' })
  confidence!: number;

  @CreateDateColumn()
  createdAt!: Date;
}

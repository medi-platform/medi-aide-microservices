import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Index(['email'])
@Index(['createdAt'])
@Entity('user_profiles')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  address!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { 
  CaregiverLifecycleState, 
  StateTransition, 
  EligibilitySnapshot,
} from '../types/lifecycle.types';

@Entity('caregiver_lifecycles')
@Index(['caregiverId'], { unique: true })
@Index(['currentState'])
export class CaregiverLifecycleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  caregiverId!: string;

  @Column({
    name: 'current_state',
    type: 'enum',
    enum: CaregiverLifecycleState,
    default: CaregiverLifecycleState.REGISTERED,
  })
  currentState!: CaregiverLifecycleState;

  @Column({ name: 'state_history', type: 'jsonb', default: [] })
  stateHistory!: StateTransition[];

  @Column({ name: 'eligibility_snapshot', type: 'jsonb', nullable: true })
  eligibilitySnapshot?: EligibilitySnapshot;

  @Column({ name: 'compliance_status', type: 'jsonb', nullable: true })
  complianceStatus?: {
    isCompliant: boolean;
    expiringItems: number;
    expiredItems: number;
  };

  @Column({ name: 'last_evaluation_at', type: 'timestamptz', nullable: true })
  lastEvaluationAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


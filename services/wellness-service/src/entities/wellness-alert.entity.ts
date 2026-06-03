import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum AlertType {
  BURNOUT_RISK = 'burnout_risk',
  STRESS_LEVEL = 'stress_level',
  SLEEP_QUALITY = 'sleep_quality',
  HEART_RATE = 'heart_rate',
  ACTIVITY_LEVEL = 'activity_level',
  WELLNESS_SCORE = 'wellness_score',
  INTERVENTION_DUE = 'intervention_due',
  CHECK_IN_MISSED = 'check_in_missed',
  VITALS_ABNORMAL = 'vitals_abnormal',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated',
}

@Entity('wellness_alerts')
@Index(['userId', 'status'])
@Index(['userId', 'alertType'])
@Index(['severity', 'status'])
export class WellnessAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'alert_type', type: 'enum', enum: AlertType })
  alertType!: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity!: AlertSeverity;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  status!: AlertStatus;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  thresholds?: {
    thresholdValue: number;
    actualValue: number;
    thresholdType: 'above' | 'below' | 'range';
  };

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes?: string;

  @Column({ name: 'notification_sent', type: 'boolean', default: false })
  notificationSent!: boolean;

  @Column({ name: 'notification_sent_at', type: 'timestamptz', nullable: true })
  notificationSentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

import { Injectable, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { notificationsFailed, notificationsSent, notificationsRetried } from '../controllers/metrics.controller';
import { DualWriteService } from '@medi-aide/migration-tools';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // exponential backoff

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly dualWriteService: DualWriteService,
    @Optional()
    @InjectRepository(Notification)
    private readonly notificationRepo?: Repository<Notification>,
  ) {}

  async createAndDispatch(dto: CreateNotificationDto): Promise<Notification> {
    const toCreate: Partial<Notification> = {
      userId: dto.userId,
      type: dto.type,
      recipient: dto.recipient,
      subject: dto.subject,
      body: dto.body,
      variables: dto.variables || {},
      status: dto.scheduledAt ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    };

    let saved: Notification;
    if (this.notificationRepo) {
      saved = await this.notificationRepo.save(this.notificationRepo.create(toCreate));
    } else {
      // Fallback in-memory stub when DB not available
      saved = {
        id: crypto.randomUUID(),
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        ...toCreate,
      } as Notification;
    }

    // If scheduled, leave for background processor
    if (saved.status === NotificationStatus.SCHEDULED) {
      return saved;
    }

    try {
      await this.dispatchWithRetry(saved);
      saved.status = NotificationStatus.SENT;
      saved.sentAt = new Date();
      notificationsSent.labels(saved.type).inc();
    } catch (error: any) {
      saved.status = NotificationStatus.FAILED;
      saved.errorMessage = error?.message || 'dispatch failed';
      notificationsFailed.labels(saved.type).inc();
      this.logger.error(`Failed to dispatch notification ${saved.id}: ${error.message}`, error.stack);
    }

    if (this.notificationRepo) {
      await this.notificationRepo.save(saved);
    }

    // Phase 4: Dual-write shadow to monolith (best-effort)
    const secondaryBase = process.env.SECONDARY_API_BASE;
    if (secondaryBase) {
      // do not throw on errors; primary already persisted
      await this.dualWriteService.write('notifications.create', {
        primary: async () => saved,
        secondary: async () => {
          await axios.post(
            `${secondaryBase.replace(/\/$/, '')}/api/v1/notifications/shadow`,
            {
              id: saved.id,
              userId: saved.userId,
              type: saved.type,
              recipient: saved.recipient,
              subject: saved.subject,
              body: saved.body,
              variables: saved.variables,
              createdAt: saved.createdAt,
            },
            { timeout: Number(process.env.MIGRATION_REQUEST_TIMEOUT_MS || 5000) }
          );
          return { ok: true } as any;
        },
      });
    }
    return saved;
  }

  async dispatchWithRetry(n: Notification): Promise<void> {
    const circuitBreaker = this.circuitBreakerService.getCircuitBreaker(n.type);
    
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = this.RETRY_DELAYS[Math.min(attempt - 1, this.RETRY_DELAYS.length - 1)];
        this.logger.warn(`Retrying notification ${n.id} (attempt ${attempt}/${this.MAX_RETRIES}) after ${delay}ms`);
        notificationsRetried.labels(n.type).inc();
        await this.sleep(delay);
      }

      try {
        await circuitBreaker.execute(async () => {
          await this.dispatch(n);
        });
        return; // Success!
      } catch (error: any) {
        lastError = error;
        n.retryCount = attempt + 1;
        
        if (this.notificationRepo) {
          await this.notificationRepo.save(n);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async dispatch(n: Notification): Promise<void> {
    const startTime = Date.now();
    
    try {
      switch (n.type) {
        case NotificationType.EMAIL:
          await this.emailService.send({ 
            to: n.recipient, 
            subject: n.subject || '', 
            body: n.body, 
            variables: n.variables 
          });
          break;
        case NotificationType.SMS:
          await this.smsService.send({ 
            to: n.recipient, 
            body: n.body, 
            variables: n.variables 
          });
          break;
        case NotificationType.PUSH:
          await this.pushService.send({ 
            to: n.recipient, 
            body: n.body, 
            variables: n.variables 
          });
          break;
        case NotificationType.IN_APP:
          // In-app notifications are stored in DB and fetched by clients
          this.logger.debug(`In-app notification ${n.id} stored for user ${n.userId}`);
          break;
        default:
          throw new Error(`Unsupported notification type: ${n.type}`);
      }
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Dispatched ${n.type} notification ${n.id} in ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to dispatch ${n.type} notification ${n.id} after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async findRecent(limit = 50): Promise<Notification[]> {
    if (this.notificationRepo) {
      return this.notificationRepo.find({ order: { createdAt: 'DESC' }, take: limit });
    }
    return [];
  }

  async findById(id: string): Promise<Notification | null> {
    if (this.notificationRepo) {
      return this.notificationRepo.findOne({ where: { id } });
    }
    return null;
  }
}

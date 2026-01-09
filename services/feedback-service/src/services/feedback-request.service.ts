import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { randomBytes } from 'crypto';
import { FeedbackRequest, FeedbackRequestStatus } from '../entities/feedback-request.entity';
import { FeedbackReminder, ReminderStatus } from '../entities/feedback-reminder.entity';

interface CreateFeedbackRequestDto {
  surveyId: string;
  recipientId: string;
  recipientType: 'patient' | 'caregiver' | 'family' | 'agency';
  recipientEmail?: string;
  recipientPhone?: string;
  contextType?: 'visit' | 'shift' | 'contract' | 'onboarding' | 'general';
  contextId?: string;
  contextData?: Record<string, any>;
  triggerId?: string;
  scheduleId?: string;
  sentVia?: 'email' | 'sms' | 'push' | 'in_app';
  expiresInDays?: number;
}

@Injectable()
export class FeedbackRequestService {
  private readonly logger = new Logger(FeedbackRequestService.name);

  constructor(
    @InjectRepository(FeedbackRequest)
    private readonly requestRepo: Repository<FeedbackRequest>,
    @InjectRepository(FeedbackReminder)
    private readonly reminderRepo: Repository<FeedbackReminder>,
  ) {}

  async createRequest(dto: CreateFeedbackRequestDto): Promise<FeedbackRequest> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 7));

    const request = this.requestRepo.create({
      ...dto,
      token,
      expiresAt,
      status: FeedbackRequestStatus.PENDING,
    });

    const saved = await this.requestRepo.save(request);

    // Schedule reminders
    await this.scheduleReminders(saved.id);

    this.logger.log(`Feedback request ${saved.id} created for ${dto.recipientType} ${dto.recipientId}`);

    return saved;
  }

  async getRequest(id: string): Promise<FeedbackRequest> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Feedback request ${id} not found`);
    }
    return request;
  }

  async getByToken(token: string): Promise<FeedbackRequest> {
    const request = await this.requestRepo.findOne({ where: { token } });
    if (!request) {
      throw new NotFoundException('Invalid feedback request token');
    }
    return request;
  }

  async markAsSent(id: string, sentVia: 'email' | 'sms' | 'push' | 'in_app'): Promise<FeedbackRequest> {
    const request = await this.getRequest(id);
    request.status = FeedbackRequestStatus.SENT;
    request.sentVia = sentVia;
    request.sentAt = new Date();
    return this.requestRepo.save(request);
  }

  async markAsOpened(id: string): Promise<FeedbackRequest> {
    const request = await this.getRequest(id);
    if (request.status === FeedbackRequestStatus.SENT) {
      request.status = FeedbackRequestStatus.OPENED;
      request.openedAt = new Date();
    }
    return this.requestRepo.save(request);
  }

  async markAsStarted(id: string): Promise<FeedbackRequest> {
    const request = await this.getRequest(id);
    request.status = FeedbackRequestStatus.STARTED;
    request.startedAt = new Date();
    return this.requestRepo.save(request);
  }

  async markAsCompleted(id: string, responseId: string): Promise<FeedbackRequest> {
    const request = await this.getRequest(id);
    request.status = FeedbackRequestStatus.COMPLETED;
    request.completedAt = new Date();
    request.responseId = responseId;

    // Cancel pending reminders
    await this.reminderRepo.update(
      { feedbackRequestId: id, status: ReminderStatus.SCHEDULED },
      { status: ReminderStatus.CANCELLED },
    );

    return this.requestRepo.save(request);
  }

  async markAsDeclined(id: string): Promise<FeedbackRequest> {
    const request = await this.getRequest(id);
    request.status = FeedbackRequestStatus.DECLINED;

    await this.reminderRepo.update(
      { feedbackRequestId: id, status: ReminderStatus.SCHEDULED },
      { status: ReminderStatus.CANCELLED },
    );

    return this.requestRepo.save(request);
  }

  async getPendingRequests(recipientId: string): Promise<FeedbackRequest[]> {
    return this.requestRepo.find({
      where: {
        recipientId,
        status: FeedbackRequestStatus.SENT,
        expiresAt: LessThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async expireOldRequests(): Promise<number> {
    const result = await this.requestRepo.update(
      {
        status: FeedbackRequestStatus.SENT,
        expiresAt: LessThan(new Date()),
      },
      { status: FeedbackRequestStatus.EXPIRED },
    );

    return result.affected || 0;
  }

  private async scheduleReminders(requestId: string): Promise<void> {
    const reminderDays = [2, 5]; // Send reminders after 2 and 5 days

    for (let i = 0; i < reminderDays.length; i++) {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + reminderDays[i]);

      const reminder = this.reminderRepo.create({
        feedbackRequestId: requestId,
        reminderNumber: i + 1,
        scheduledAt,
        status: ReminderStatus.SCHEDULED,
      });

      await this.reminderRepo.save(reminder);
    }
  }

  async getDueReminders(): Promise<FeedbackReminder[]> {
    return this.reminderRepo.find({
      where: {
        status: ReminderStatus.SCHEDULED,
        scheduledAt: LessThan(new Date()),
      },
    });
  }

  async sendReminder(reminderId: string, sentVia: 'email' | 'sms' | 'push'): Promise<FeedbackReminder> {
    const reminder = await this.reminderRepo.findOne({ where: { id: reminderId } });
    if (!reminder) {
      throw new NotFoundException(`Reminder ${reminderId} not found`);
    }

    reminder.status = ReminderStatus.SENT;
    reminder.sentAt = new Date();
    reminder.sentVia = sentVia;

    return this.reminderRepo.save(reminder);
  }
}

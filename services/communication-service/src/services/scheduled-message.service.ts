import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScheduledMessage, ScheduledMessageStatus } from '../entities/scheduled-message.entity';
import { MessageType } from '../interfaces/communication.interface';

interface ScheduleMessageDto {
  conversationId: string;
  senderId: string;
  type?: MessageType;
  content?: string;
  attachments?: ScheduledMessage['attachments'];
  scheduledAt: Date;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: Date;
  timezone?: string;
}

@Injectable()
export class ScheduledMessageService {
  private readonly logger = new Logger(ScheduledMessageService.name);

  constructor(
    @InjectRepository(ScheduledMessage)
    private readonly scheduledRepo: Repository<ScheduledMessage>,
  ) {}

  async scheduleMessage(dto: ScheduleMessageDto): Promise<ScheduledMessage> {
    if (dto.scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const scheduled = this.scheduledRepo.create({
      ...dto,
      type: dto.type || MessageType.TEXT,
      attachments: dto.attachments || [],
      status: ScheduledMessageStatus.PENDING,
    });

    const saved = await this.scheduledRepo.save(scheduled);
    this.logger.log(`Message scheduled for ${dto.scheduledAt} in conversation ${dto.conversationId}`);

    return saved;
  }

  async getScheduledMessage(id: string): Promise<ScheduledMessage> {
    const scheduled = await this.scheduledRepo.findOne({ where: { id } });
    if (!scheduled) {
      throw new NotFoundException(`Scheduled message ${id} not found`);
    }
    return scheduled;
  }

  async updateScheduledMessage(
    id: string,
    dto: Partial<ScheduleMessageDto>,
  ): Promise<ScheduledMessage> {
    const scheduled = await this.getScheduledMessage(id);

    if (scheduled.status !== ScheduledMessageStatus.PENDING) {
      throw new BadRequestException('Can only update pending scheduled messages');
    }

    if (dto.scheduledAt && dto.scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    Object.assign(scheduled, dto);
    return this.scheduledRepo.save(scheduled);
  }

  async cancelScheduledMessage(id: string, cancelledBy: string): Promise<ScheduledMessage> {
    const scheduled = await this.getScheduledMessage(id);

    if (scheduled.status !== ScheduledMessageStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending scheduled messages');
    }

    scheduled.status = ScheduledMessageStatus.CANCELLED;
    scheduled.cancelledAt = new Date();
    scheduled.cancelledBy = cancelledBy;

    return this.scheduledRepo.save(scheduled);
  }

  async getUserScheduledMessages(senderId: string): Promise<ScheduledMessage[]> {
    return this.scheduledRepo.find({
      where: { senderId, status: ScheduledMessageStatus.PENDING },
      order: { scheduledAt: 'ASC' },
    });
  }

  async getConversationScheduledMessages(conversationId: string): Promise<ScheduledMessage[]> {
    return this.scheduledRepo.find({
      where: { conversationId, status: ScheduledMessageStatus.PENDING },
      order: { scheduledAt: 'ASC' },
    });
  }

  async getDueMessages(): Promise<ScheduledMessage[]> {
    return this.scheduledRepo.find({
      where: {
        status: ScheduledMessageStatus.PENDING,
        scheduledAt: LessThanOrEqual(new Date()),
      },
      order: { scheduledAt: 'ASC' },
    });
  }

  async markAsSent(id: string, sentMessageId: string): Promise<ScheduledMessage> {
    const scheduled = await this.getScheduledMessage(id);

    scheduled.status = ScheduledMessageStatus.SENT;
    scheduled.sentAt = new Date();
    scheduled.sentMessageId = sentMessageId;
    scheduled.occurrencesSent++;

    // Handle recurrence
    if (scheduled.isRecurring && scheduled.recurrencePattern) {
      const nextScheduledAt = this.calculateNextOccurrence(
        scheduled.scheduledAt,
        scheduled.recurrencePattern,
      );

      if (!scheduled.recurrenceEndDate || nextScheduledAt <= scheduled.recurrenceEndDate) {
        // Create next occurrence
        const next = this.scheduledRepo.create({
          conversationId: scheduled.conversationId,
          senderId: scheduled.senderId,
          type: scheduled.type,
          content: scheduled.content,
          attachments: scheduled.attachments,
          scheduledAt: nextScheduledAt,
          isRecurring: true,
          recurrencePattern: scheduled.recurrencePattern,
          recurrenceEndDate: scheduled.recurrenceEndDate,
          occurrencesSent: scheduled.occurrencesSent,
          timezone: scheduled.timezone,
          metadata: scheduled.metadata,
          status: ScheduledMessageStatus.PENDING,
        });
        await this.scheduledRepo.save(next);
      }
    }

    return this.scheduledRepo.save(scheduled);
  }

  async markAsFailed(id: string, reason: string): Promise<ScheduledMessage> {
    const scheduled = await this.getScheduledMessage(id);

    scheduled.status = ScheduledMessageStatus.FAILED;
    scheduled.failureReason = reason;

    return this.scheduledRepo.save(scheduled);
  }

  private calculateNextOccurrence(currentDate: Date, pattern: string): Date {
    const next = new Date(currentDate);

    switch (pattern) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }
}

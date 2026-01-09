import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportSubscription } from '../entities/report-subscription.entity';
import { OutputFormat } from '../entities/report-definition.entity';
import { ReportScheduleService } from './report-schedule.service';

interface SubscribeDto {
  userId: string;
  scheduleId: string;
  preferredFormat?: OutputFormat;
  email?: string;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
  includeAttachment?: boolean;
  includeDownloadLink?: boolean;
}

@Injectable()
export class ReportSubscriptionService {
  private readonly logger = new Logger(ReportSubscriptionService.name);

  constructor(
    @InjectRepository(ReportSubscription)
    private readonly subscriptionRepo: Repository<ReportSubscription>,
    private readonly scheduleService: ReportScheduleService,
  ) {}

  async subscribe(dto: SubscribeDto): Promise<ReportSubscription> {
    // Verify schedule exists
    await this.scheduleService.getSchedule(dto.scheduleId);

    // Check for existing subscription
    const existing = await this.subscriptionRepo.findOne({
      where: { userId: dto.userId, scheduleId: dto.scheduleId },
    });

    if (existing && existing.isActive) {
      throw new ConflictException('Already subscribed to this report');
    }

    if (existing) {
      // Reactivate
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      existing.subscribedAt = new Date();
      Object.assign(existing, dto);
      return this.subscriptionRepo.save(existing);
    }

    const subscription = this.subscriptionRepo.create({
      ...dto,
      isActive: true,
      subscribedAt: new Date(),
      notifyOnCompletion: dto.notifyOnCompletion ?? true,
      notifyOnFailure: dto.notifyOnFailure ?? false,
      includeAttachment: dto.includeAttachment ?? true,
      includeDownloadLink: dto.includeDownloadLink ?? true,
    });

    return this.subscriptionRepo.save(subscription);
  }

  async unsubscribe(userId: string, scheduleId: string): Promise<ReportSubscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, scheduleId, isActive: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();

    return this.subscriptionRepo.save(subscription);
  }

  async getSubscription(id: string): Promise<ReportSubscription> {
    const subscription = await this.subscriptionRepo.findOne({ where: { id } });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    return subscription;
  }

  async updateSubscription(id: string, dto: Partial<SubscribeDto>): Promise<ReportSubscription> {
    const subscription = await this.getSubscription(id);
    Object.assign(subscription, dto);
    return this.subscriptionRepo.save(subscription);
  }

  async getUserSubscriptions(userId: string): Promise<ReportSubscription[]> {
    return this.subscriptionRepo.find({
      where: { userId, isActive: true },
      order: { subscribedAt: 'DESC' },
    });
  }

  async getScheduleSubscribers(scheduleId: string): Promise<ReportSubscription[]> {
    return this.subscriptionRepo.find({
      where: { scheduleId, isActive: true },
    });
  }

  async recordAccess(userId: string, scheduleId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, scheduleId, isActive: true },
    });

    if (subscription) {
      subscription.lastAccessedAt = new Date();
      subscription.accessCount++;
      await this.subscriptionRepo.save(subscription);
    }
  }

  async getSubscriptionStats(scheduleId: string): Promise<{
    totalSubscribers: number;
    activeSubscribers: number;
    totalAccesses: number;
  }> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { scheduleId },
    });

    return {
      totalSubscribers: subscriptions.length,
      activeSubscribers: subscriptions.filter(s => s.isActive).length,
      totalAccesses: subscriptions.reduce((sum, s) => sum + s.accessCount, 0),
    };
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PushNotificationToken, PushProvider, DevicePlatform } from '../entities/push-notification-token.entity';
import { NotificationPreference, NotificationChannel, NotificationCategory } from '../entities/notification-preference.entity';
import { NotificationLog, NotificationStatus } from '../entities/notification-log.entity';

interface SendNotificationDto {
  userId: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  data?: Record<string, any>;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(PushNotificationToken)
    private readonly tokenRepo: Repository<PushNotificationToken>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
  ) {}

  // ===== PUSH TOKENS =====

  async registerToken(
    userId: string,
    token: string,
    provider: PushProvider,
    platform: DevicePlatform,
    deviceInfo?: { deviceId?: string; deviceName?: string; deviceModel?: string; osVersion?: string; appVersion?: string },
  ): Promise<PushNotificationToken> {
    // Deactivate old tokens for same device
    if (deviceInfo?.deviceId) {
      await this.tokenRepo.update(
        { userId, deviceId: deviceInfo.deviceId, isActive: true },
        { isActive: false },
      );
    }

    // Check if token already exists
    const existing = await this.tokenRepo.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      existing.failedCount = 0;
      Object.assign(existing, deviceInfo);
      return this.tokenRepo.save(existing);
    }

    const pushToken = this.tokenRepo.create({
      userId,
      token,
      provider,
      platform,
      ...deviceInfo,
      isActive: true,
    });

    return this.tokenRepo.save(pushToken);
  }

  async unregisterToken(token: string): Promise<void> {
    await this.tokenRepo.update({ token }, { isActive: false });
  }

  async getUserTokens(userId: string): Promise<PushNotificationToken[]> {
    return this.tokenRepo.find({
      where: { userId, isActive: true },
    });
  }

  async markTokenFailed(token: string, error: string): Promise<void> {
    const pushToken = await this.tokenRepo.findOne({ where: { token } });
    if (pushToken) {
      pushToken.failedCount++;
      pushToken.lastFailedAt = new Date();
      pushToken.lastError = error;

      // Deactivate after 3 consecutive failures
      if (pushToken.failedCount >= 3) {
        pushToken.isActive = false;
      }

      await this.tokenRepo.save(pushToken);
    }
  }

  // ===== PREFERENCES =====

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepo.find({ where: { userId } });
  }

  async setPreference(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
    isEnabled: boolean,
    options?: {
      quietHoursEnabled?: boolean;
      quietStartTime?: string;
      quietEndTime?: string;
      timezone?: string;
      digestEnabled?: boolean;
      digestFrequency?: 'daily' | 'weekly';
      digestTime?: string;
    },
  ): Promise<NotificationPreference> {
    let pref = await this.preferenceRepo.findOne({
      where: { userId, category, channel },
    });

    if (!pref) {
      pref = this.preferenceRepo.create({
        userId,
        category,
        channel,
      });
    }

    pref.isEnabled = isEnabled;
    if (options) {
      Object.assign(pref, options);
    }

    return this.preferenceRepo.save(pref);
  }

  async isNotificationEnabled(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const pref = await this.preferenceRepo.findOne({
      where: { userId, category, channel },
    });

    // Default to enabled if no preference set
    return pref?.isEnabled ?? true;
  }

  async isInQuietHours(userId: string): Promise<boolean> {
    const prefs = await this.preferenceRepo.find({
      where: { userId, quietHoursEnabled: true },
    });

    if (prefs.length === 0) return false;

    const pref = prefs[0];
    if (!pref.quietStartTime || !pref.quietEndTime) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Simple time comparison (doesn't handle timezone properly - would need moment-timezone)
    if (pref.quietStartTime < pref.quietEndTime) {
      return currentTime >= pref.quietStartTime && currentTime < pref.quietEndTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= pref.quietStartTime || currentTime < pref.quietEndTime;
    }
  }

  // ===== NOTIFICATION SENDING =====

  async sendNotification(dto: SendNotificationDto): Promise<NotificationLog> {
    const channels = [NotificationChannel.PUSH, NotificationChannel.IN_APP];
    const logs: NotificationLog[] = [];

    for (const channel of channels) {
      const isEnabled = await this.isNotificationEnabled(dto.userId, dto.category, channel);
      
      if (!isEnabled) continue;

      const inQuietHours = await this.isInQuietHours(dto.userId);
      if (inQuietHours && dto.category !== NotificationCategory.SECURITY) {
        continue; // Skip non-security notifications during quiet hours
      }

      const log = this.logRepo.create({
        userId: dto.userId,
        category: dto.category,
        channel,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        status: NotificationStatus.PENDING,
      });

      await this.logRepo.save(log);
      logs.push(log);

      // Actually send the notification (would integrate with push service)
      try {
        await this.dispatchNotification(log);
        log.status = NotificationStatus.SENT;
        log.sentAt = new Date();
      } catch (error: any) {
        log.status = NotificationStatus.FAILED;
        log.errorMessage = error.message;
        log.retryCount++;
        log.nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 min
      }

      await this.logRepo.save(log);
    }

    return logs[0] || this.logRepo.create({
      userId: dto.userId,
      category: dto.category,
      channel: NotificationChannel.IN_APP,
      title: dto.title,
      status: NotificationStatus.FAILED,
      errorMessage: 'All channels disabled or in quiet hours',
    });
  }

  private async dispatchNotification(log: NotificationLog): Promise<void> {
    if (log.channel === NotificationChannel.PUSH) {
      const tokens = await this.getUserTokens(log.userId);
      for (const token of tokens) {
        // Would call FCM/APNS here
        this.logger.debug(`Push notification to ${token.provider}: ${log.title}`);
        token.lastUsedAt = new Date();
        await this.tokenRepo.save(token);
      }
    }
    // Other channels would be handled similarly
  }

  // ===== LOGS =====

  async getNotificationLogs(
    userId: string,
    limit: number = 50,
  ): Promise<NotificationLog[]> {
    return this.logRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsOpened(logId: string): Promise<void> {
    await this.logRepo.update(logId, {
      status: NotificationStatus.OPENED,
      openedAt: new Date(),
    });
  }

  async markAsClicked(logId: string): Promise<void> {
    await this.logRepo.update(logId, {
      status: NotificationStatus.CLICKED,
      clickedAt: new Date(),
    });
  }

  async retryFailedNotifications(): Promise<number> {
    const failedLogs = await this.logRepo.find({
      where: {
        status: NotificationStatus.FAILED,
        nextRetryAt: LessThan(new Date()),
      },
      take: 100,
    });

    let retried = 0;
    for (const log of failedLogs) {
      if (log.retryCount >= 3) {
        log.status = NotificationStatus.BOUNCED;
        await this.logRepo.save(log);
        continue;
      }

      try {
        await this.dispatchNotification(log);
        log.status = NotificationStatus.SENT;
        log.sentAt = new Date();
        retried++;
      } catch (error: any) {
        log.retryCount++;
        log.errorMessage = error.message;
        log.nextRetryAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      }

      await this.logRepo.save(log);
    }

    return retried;
  }
}

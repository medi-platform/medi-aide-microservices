/**
 * Guardian Service
 * Business logic for managing guardian/family accounts and notifications
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuardianAccount, GuardianStatus, GuardianRole } from '../entities/guardian-account.entity';
import {
  GuardianNotificationLog,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../entities/guardian-notification-log.entity';

export interface CreateGuardianAccountDto {
  residence_id: string;
  resident_id: string;
  user_id: string;
  role: GuardianRole;
  full_name: string;
  relationship?: string;
  email: string;
  phone?: string;
  address?: string;
  has_legal_authority?: boolean;
}

export interface UpdateGuardianAccountDto {
  role?: GuardianRole;
  full_name?: string;
  relationship?: string;
  phone?: string;
  address?: string;
  can_view_care_notes?: boolean;
  can_view_assessments?: boolean;
  can_view_medications?: boolean;
  can_view_activities?: boolean;
  can_view_photos?: boolean;
  can_message_staff?: boolean;
  can_schedule_visits?: boolean;
  can_approve_outings?: boolean;
  can_make_care_decisions?: boolean;
  can_access_financial?: boolean;
  notify_incidents?: boolean;
  notify_health_changes?: boolean;
  notify_appointments?: boolean;
  notify_daily_summary?: boolean;
  notify_weekly_summary?: boolean;
  notification_channels?: string[];
}

export interface SendNotificationDto {
  guardian_account_id: string;
  resident_id: string;
  residence_id: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  content: string;
  html_content?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  priority?: string;
}

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(GuardianAccount)
    private readonly guardianRepository: Repository<GuardianAccount>,
    @InjectRepository(GuardianNotificationLog)
    private readonly notificationRepository: Repository<GuardianNotificationLog>,
  ) {}

  // Guardian Account Methods
  async createGuardianAccount(dto: CreateGuardianAccountDto): Promise<GuardianAccount> {
    // Check if account already exists
    const existing = await this.guardianRepository.findOne({
      where: { resident_id: dto.resident_id, user_id: dto.user_id },
    });

    if (existing) {
      throw new BadRequestException('Guardian account already exists for this resident-user pair');
    }

    const account = this.guardianRepository.create({
      ...dto,
      status: GuardianStatus.PENDING,
    });

    return this.guardianRepository.save(account);
  }

  async findGuardianById(id: string): Promise<GuardianAccount> {
    const account = await this.guardianRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Guardian account with ID ${id} not found`);
    }
    return account;
  }

  async updateGuardianAccount(id: string, dto: UpdateGuardianAccountDto): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    Object.assign(account, dto);
    return this.guardianRepository.save(account);
  }

  async activateAccount(id: string): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    if (account.status !== GuardianStatus.PENDING) {
      throw new BadRequestException('Only pending accounts can be activated');
    }
    account.status = GuardianStatus.ACTIVE;
    return this.guardianRepository.save(account);
  }

  async verifyIdentity(id: string, verifiedBy: string): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    account.identity_verified = true;
    account.verified_at = new Date();
    account.verified_by = verifiedBy;
    return this.guardianRepository.save(account);
  }

  async suspendAccount(id: string, reason: string, suspendedBy: string): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    account.status = GuardianStatus.SUSPENDED;
    account.suspension_reason = reason;
    account.suspended_at = new Date();
    account.suspended_by = suspendedBy;
    return this.guardianRepository.save(account);
  }

  async revokeAccount(id: string, reason: string): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    account.status = GuardianStatus.REVOKED;
    account.suspension_reason = reason;
    return this.guardianRepository.save(account);
  }

  async reactivateAccount(id: string): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    if (account.status !== GuardianStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended accounts can be reactivated');
    }
    account.status = GuardianStatus.ACTIVE;
    account.suspension_reason = undefined;
    account.suspended_at = undefined;
    account.suspended_by = undefined;
    return this.guardianRepository.save(account);
  }

  async addLegalDocument(
    id: string,
    documentType: string,
    fileId: string,
    expiresAt?: Date,
  ): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    account.legal_documents.push({
      documentType,
      fileId,
      uploadedAt: new Date(),
      expiresAt,
    });
    account.has_legal_authority = true;
    return this.guardianRepository.save(account);
  }

  async recordLogin(id: string): Promise<GuardianAccount> {
    const account = await this.findGuardianById(id);
    account.last_login_at = new Date();
    account.login_count += 1;
    return this.guardianRepository.save(account);
  }

  async listByResident(residentId: string): Promise<GuardianAccount[]> {
    return this.guardianRepository.find({
      where: { resident_id: residentId, status: GuardianStatus.ACTIVE },
      order: { role: 'ASC' },
    });
  }

  async listByResidence(residenceId: string): Promise<GuardianAccount[]> {
    return this.guardianRepository.find({
      where: { residence_id: residenceId, status: GuardianStatus.ACTIVE },
      order: { full_name: 'ASC' },
    });
  }

  async getPrimaryGuardian(residentId: string): Promise<GuardianAccount | null> {
    return this.guardianRepository.findOne({
      where: {
        resident_id: residentId,
        role: GuardianRole.PRIMARY_GUARDIAN,
        status: GuardianStatus.ACTIVE,
      },
    });
  }

  // Notification Methods
  async sendNotification(dto: SendNotificationDto): Promise<GuardianNotificationLog> {
    const notification = this.notificationRepository.create({
      ...dto,
      status: NotificationStatus.PENDING,
      priority: dto.priority || 'normal',
      is_automated: true,
    });

    const saved = await this.notificationRepository.save(notification);

    // In a real implementation, this would trigger the actual notification sending
    // For now, we'll simulate success
    saved.status = NotificationStatus.SENT;
    saved.sent_at = new Date();
    
    return this.notificationRepository.save(saved);
  }

  async markNotificationDelivered(id: string): Promise<GuardianNotificationLog> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.status = NotificationStatus.DELIVERED;
    notification.delivered_at = new Date();
    return this.notificationRepository.save(notification);
  }

  async markNotificationRead(id: string): Promise<GuardianNotificationLog> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.status = NotificationStatus.READ;
    notification.read_at = new Date();
    return this.notificationRepository.save(notification);
  }

  async markNotificationFailed(id: string, reason: string): Promise<GuardianNotificationLog> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.status = NotificationStatus.FAILED;
    notification.failed_at = new Date();
    notification.failure_reason = reason;
    notification.retry_count += 1;
    return this.notificationRepository.save(notification);
  }

  async getNotificationHistory(guardianAccountId: string, limit: number = 50): Promise<GuardianNotificationLog[]> {
    return this.notificationRepository.find({
      where: { guardian_account_id: guardianAccountId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async notifyGuardiansOfIncident(
    residentId: string,
    residenceId: string,
    incidentId: string,
    incidentSummary: string,
    severity: string,
  ): Promise<void> {
    const guardians = await this.guardianRepository.find({
      where: {
        resident_id: residentId,
        status: GuardianStatus.ACTIVE,
        notify_incidents: true,
      },
    });

    for (const guardian of guardians) {
      for (const channel of guardian.notification_channels as NotificationChannel[]) {
        await this.sendNotification({
          guardian_account_id: guardian.id,
          resident_id: residentId,
          residence_id: residenceId,
          notification_type: severity === 'critical' ? NotificationType.URGENT : NotificationType.INCIDENT,
          channel,
          subject: `Incident Report: ${severity.toUpperCase()}`,
          content: incidentSummary,
          related_entity_type: 'serious_occurrence',
          related_entity_id: incidentId,
          priority: severity === 'critical' ? 'high' : 'normal',
        });
      }
    }
  }
}

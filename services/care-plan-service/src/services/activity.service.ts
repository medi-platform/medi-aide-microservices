import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import {
  CarePlanActivity,
  ActivityStatus,
  ActivityKind,
} from '../entities/care-plan-activity.entity';
import { CarePlanRevision, RevisionType } from '../entities/care-plan-revision.entity';

interface CreateActivityDto {
  carePlanId: string;
  patientId: string;
  goalId?: string;
  kind?: ActivityKind;
  code?: string;
  description: string;
  schedule?: CarePlanActivity['schedule'];
  scheduledStart?: Date;
  scheduledEnd?: Date;
  assignedTo?: string;
  assignedRole?: string;
  location?: string;
  instructions?: string;
  durationMinutes?: number;
}

interface UpdateActivityDto {
  description?: string;
  status?: ActivityStatus;
  statusReason?: string;
  schedule?: CarePlanActivity['schedule'];
  scheduledStart?: Date;
  scheduledEnd?: Date;
  assignedTo?: string;
  assignedRole?: string;
  location?: string;
  instructions?: string;
  durationMinutes?: number;
}

interface CompleteActivityDto {
  completionNotes?: string;
  durationMinutes?: number;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(CarePlanActivity)
    private readonly activityRepo: Repository<CarePlanActivity>,
    @InjectRepository(CarePlanRevision)
    private readonly revisionRepo: Repository<CarePlanRevision>,
  ) {}

  /**
   * Create a new activity
   */
  async createActivity(dto: CreateActivityDto, userId: string): Promise<CarePlanActivity> {
    const activity = this.activityRepo.create({
      ...dto,
      kind: dto.kind || ActivityKind.TASK,
      status: ActivityStatus.NOT_STARTED,
    });

    await this.activityRepo.save(activity);

    await this.recordRevision(
      dto.carePlanId,
      userId,
      RevisionType.ACTIVITY_ADDED,
      `Activity added: ${dto.description.substring(0, 50)}...`,
      activity.id,
    );

    this.logger.log(`Activity created: ${activity.id}`);

    return activity;
  }

  /**
   * Get activity by ID
   */
  async getActivity(activityId: string): Promise<CarePlanActivity> {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } });
    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }
    return activity;
  }

  /**
   * Get activities for a care plan
   */
  async getCarePlanActivities(
    carePlanId: string,
    status?: ActivityStatus,
  ): Promise<CarePlanActivity[]> {
    const where: any = { carePlanId };
    if (status) {
      where.status = status;
    }

    return this.activityRepo.find({
      where,
      order: { scheduledStart: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get activities for a goal
   */
  async getGoalActivities(goalId: string): Promise<CarePlanActivity[]> {
    return this.activityRepo.find({
      where: { goalId },
      order: { scheduledStart: 'ASC' },
    });
  }

  /**
   * Get activities assigned to a user
   */
  async getAssignedActivities(
    userId: string,
    options?: {
      status?: ActivityStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<CarePlanActivity[]> {
    const where: any = { assignedTo: userId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate && options?.endDate) {
      where.scheduledStart = Between(options.startDate, options.endDate);
    } else if (options?.startDate) {
      where.scheduledStart = MoreThanOrEqual(options.startDate);
    } else if (options?.endDate) {
      where.scheduledStart = LessThanOrEqual(options.endDate);
    }

    return this.activityRepo.find({
      where,
      order: { scheduledStart: 'ASC' },
    });
  }

  /**
   * Update an activity
   */
  async updateActivity(
    activityId: string,
    dto: UpdateActivityDto,
    userId: string,
  ): Promise<CarePlanActivity> {
    const activity = await this.getActivity(activityId);
    const changes: any[] = [];

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && (activity as any)[key] !== value) {
        changes.push({
          field: key,
          oldValue: (activity as any)[key],
          newValue: value,
        });
        (activity as any)[key] = value;
      }
    }

    if (changes.length === 0) {
      return activity;
    }

    await this.activityRepo.save(activity);

    await this.recordRevision(
      activity.carePlanId,
      userId,
      RevisionType.ACTIVITY_UPDATED,
      `Activity updated: ${changes.map(c => c.field).join(', ')}`,
      activity.id,
      changes,
    );

    this.logger.log(`Activity updated: ${activityId}`);

    return activity;
  }

  /**
   * Start an activity
   */
  async startActivity(activityId: string, userId: string): Promise<CarePlanActivity> {
    const activity = await this.getActivity(activityId);

    if (activity.status !== ActivityStatus.NOT_STARTED && activity.status !== ActivityStatus.SCHEDULED) {
      throw new BadRequestException(`Activity cannot be started from status: ${activity.status}`);
    }

    activity.status = ActivityStatus.IN_PROGRESS;

    await this.activityRepo.save(activity);

    await this.recordRevision(
      activity.carePlanId,
      userId,
      RevisionType.ACTIVITY_UPDATED,
      `Activity started`,
      activity.id,
    );

    return activity;
  }

  /**
   * Complete an activity
   */
  async completeActivity(
    activityId: string,
    dto: CompleteActivityDto,
    userId: string,
  ): Promise<CarePlanActivity> {
    const activity = await this.getActivity(activityId);

    if (activity.status === ActivityStatus.COMPLETED) {
      throw new BadRequestException('Activity is already completed');
    }

    activity.status = ActivityStatus.COMPLETED;
    activity.completedAt = new Date();
    activity.completedBy = userId;

    if (dto.completionNotes) {
      activity.completionNotes = dto.completionNotes;
    }

    if (dto.durationMinutes) {
      activity.durationMinutes = dto.durationMinutes;
    }

    await this.activityRepo.save(activity);

    await this.recordRevision(
      activity.carePlanId,
      userId,
      RevisionType.ACTIVITY_UPDATED,
      `Activity completed${dto.completionNotes ? ': ' + dto.completionNotes.substring(0, 50) : ''}`,
      activity.id,
    );

    this.logger.log(`Activity completed: ${activityId}`);

    return activity;
  }

  /**
   * Cancel an activity
   */
  async cancelActivity(
    activityId: string,
    reason: string,
    userId: string,
  ): Promise<CarePlanActivity> {
    const activity = await this.getActivity(activityId);

    if (activity.status === ActivityStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed activity');
    }

    activity.status = ActivityStatus.CANCELLED;
    activity.statusReason = reason;

    await this.activityRepo.save(activity);

    await this.recordRevision(
      activity.carePlanId,
      userId,
      RevisionType.ACTIVITY_UPDATED,
      `Activity cancelled: ${reason}`,
      activity.id,
    );

    return activity;
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string, userId: string): Promise<void> {
    const activity = await this.getActivity(activityId);

    await this.recordRevision(
      activity.carePlanId,
      userId,
      RevisionType.ACTIVITY_REMOVED,
      `Activity removed: ${activity.description.substring(0, 50)}...`,
      activity.id,
    );

    await this.activityRepo.remove(activity);

    this.logger.log(`Activity deleted: ${activityId}`);
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(carePlanId: string): Promise<{
    totalActivities: number;
    byStatus: Record<ActivityStatus, number>;
    byKind: Record<ActivityKind, number>;
    completionRate: number;
    overdueCount: number;
  }> {
    const activities = await this.getCarePlanActivities(carePlanId);

    const byStatus = {} as Record<ActivityStatus, number>;
    const byKind = {} as Record<ActivityKind, number>;
    let completedCount = 0;
    let overdueCount = 0;
    const now = new Date();

    for (const activity of activities) {
      byStatus[activity.status] = (byStatus[activity.status] || 0) + 1;
      byKind[activity.kind] = (byKind[activity.kind] || 0) + 1;

      if (activity.status === ActivityStatus.COMPLETED) {
        completedCount++;
      }

      if (
        activity.scheduledEnd &&
        activity.scheduledEnd < now &&
        activity.status !== ActivityStatus.COMPLETED &&
        activity.status !== ActivityStatus.CANCELLED
      ) {
        overdueCount++;
      }
    }

    return {
      totalActivities: activities.length,
      byStatus,
      byKind,
      completionRate: activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0,
      overdueCount,
    };
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(
    patientId: string,
    days: number = 7,
  ): Promise<CarePlanActivity[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.activityRepo.find({
      where: {
        patientId,
        scheduledStart: Between(now, futureDate),
        status: In([ActivityStatus.NOT_STARTED, ActivityStatus.SCHEDULED, ActivityStatus.IN_PROGRESS]),
      },
      order: { scheduledStart: 'ASC' },
    });
  }

  /**
   * Record a revision
   */
  private async recordRevision(
    carePlanId: string,
    userId: string,
    type: RevisionType,
    summary: string,
    relatedEntityId?: string,
    changes?: any[],
  ): Promise<void> {
    const lastRevision = await this.revisionRepo.findOne({
      where: { carePlanId },
      order: { version: 'DESC' },
    });

    const revision = this.revisionRepo.create({
      carePlanId,
      userId,
      revisionType: type,
      version: (lastRevision?.version || 0) + 1,
      summary,
      relatedEntityType: 'Activity',
      relatedEntityId,
      changes,
    });

    await this.revisionRepo.save(revision);
  }
}


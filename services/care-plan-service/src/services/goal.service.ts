import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CarePlanGoal,
  GoalStatus,
  GoalPriority,
  GoalCategory,
} from '../entities/care-plan-goal.entity';
import { CarePlanRevision, RevisionType } from '../entities/care-plan-revision.entity';

interface CreateGoalDto {
  carePlanId: string;
  patientId: string;
  description: string;
  priority?: GoalPriority;
  category?: GoalCategory;
  startDate?: Date;
  targetDate?: Date;
  target?: CarePlanGoal['target'];
  addresses?: string[];
  expressedBy?: string;
}

interface UpdateGoalDto {
  description?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  category?: GoalCategory;
  startDate?: Date;
  targetDate?: Date;
  target?: CarePlanGoal['target'];
  achievementStatus?: CarePlanGoal['achievementStatus'];
  progressPercentage?: number;
  progressNotes?: string;
}

interface GoalOutcome {
  date: Date;
  value: number | string;
  notes?: string;
}

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  constructor(
    @InjectRepository(CarePlanGoal)
    private readonly goalRepo: Repository<CarePlanGoal>,
    @InjectRepository(CarePlanRevision)
    private readonly revisionRepo: Repository<CarePlanRevision>,
  ) {}

  /**
   * Create a new goal
   */
  async createGoal(dto: CreateGoalDto, userId: string): Promise<CarePlanGoal> {
    const goal = this.goalRepo.create({
      ...dto,
      status: GoalStatus.PROPOSED,
      priority: dto.priority || GoalPriority.MEDIUM,
      progressPercentage: 0,
    });

    await this.goalRepo.save(goal);

    // Record revision
    await this.recordRevision(
      dto.carePlanId,
      userId,
      RevisionType.GOAL_ADDED,
      `Goal added: ${dto.description.substring(0, 50)}...`,
      goal.id,
    );

    this.logger.log(`Goal created: ${goal.id} for care plan ${dto.carePlanId}`);

    return goal;
  }

  /**
   * Get goal by ID
   */
  async getGoal(goalId: string): Promise<CarePlanGoal> {
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }
    return goal;
  }

  /**
   * Get goals for a care plan
   */
  async getCarePlanGoals(
    carePlanId: string,
    status?: GoalStatus,
  ): Promise<CarePlanGoal[]> {
    const where: any = { carePlanId };
    if (status) {
      where.status = status;
    }

    return this.goalRepo.find({
      where,
      order: { priority: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Update a goal
   */
  async updateGoal(
    goalId: string,
    dto: UpdateGoalDto,
    userId: string,
  ): Promise<CarePlanGoal> {
    const goal = await this.getGoal(goalId);
    const changes: any[] = [];

    // Track changes for revision
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && (goal as any)[key] !== value) {
        changes.push({
          field: key,
          oldValue: (goal as any)[key],
          newValue: value,
        });
        (goal as any)[key] = value;
      }
    }

    if (changes.length === 0) {
      return goal;
    }

    await this.goalRepo.save(goal);

    // Record revision
    await this.recordRevision(
      goal.carePlanId,
      userId,
      RevisionType.GOAL_UPDATED,
      `Goal updated: ${changes.map(c => c.field).join(', ')}`,
      goal.id,
      changes,
    );

    this.logger.log(`Goal updated: ${goalId}`);

    return goal;
  }

  /**
   * Record an outcome for a goal
   */
  async recordOutcome(
    goalId: string,
    outcome: GoalOutcome,
    userId: string,
  ): Promise<CarePlanGoal> {
    const goal = await this.getGoal(goalId);

    const outcomes = goal.outcomes || [];
    outcomes.push(outcome);
    goal.outcomes = outcomes;

    // Update progress if numeric outcome
    if (typeof outcome.value === 'number' && goal.target?.detailQuantity) {
      const targetValue = goal.target.detailQuantity.value;
      const progress = Math.min(100, Math.round((outcome.value / targetValue) * 100));
      goal.progressPercentage = progress;

      // Auto-update achievement status
      if (progress >= 100) {
        goal.achievementStatus = 'achieved';
      } else if (progress > 0) {
        goal.achievementStatus = 'in-progress';
      }
    }

    await this.goalRepo.save(goal);

    await this.recordRevision(
      goal.carePlanId,
      userId,
      RevisionType.GOAL_UPDATED,
      `Outcome recorded: ${outcome.value}`,
      goal.id,
    );

    return goal;
  }

  /**
   * Transition goal status
   */
  async transitionStatus(
    goalId: string,
    newStatus: GoalStatus,
    userId: string,
    reason?: string,
  ): Promise<CarePlanGoal> {
    const goal = await this.getGoal(goalId);
    const oldStatus = goal.status;

    // Validate transition
    this.validateStatusTransition(oldStatus, newStatus);

    goal.status = newStatus;

    // Update achievement status based on lifecycle status
    if (newStatus === GoalStatus.COMPLETED) {
      goal.achievementStatus = 'achieved';
      goal.progressPercentage = 100;
    } else if (newStatus === GoalStatus.CANCELLED) {
      goal.achievementStatus = 'not-achieved';
    }

    await this.goalRepo.save(goal);

    await this.recordRevision(
      goal.carePlanId,
      userId,
      RevisionType.STATUS_CHANGE,
      `Goal status changed: ${oldStatus} → ${newStatus}${reason ? ` (${reason})` : ''}`,
      goal.id,
    );

    this.logger.log(`Goal ${goalId} status changed: ${oldStatus} → ${newStatus}`);

    return goal;
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const goal = await this.getGoal(goalId);

    await this.recordRevision(
      goal.carePlanId,
      userId,
      RevisionType.GOAL_REMOVED,
      `Goal removed: ${goal.description.substring(0, 50)}...`,
      goal.id,
    );

    await this.goalRepo.remove(goal);

    this.logger.log(`Goal deleted: ${goalId}`);
  }

  /**
   * Get goal progress summary
   */
  async getProgressSummary(carePlanId: string): Promise<{
    totalGoals: number;
    byStatus: Record<GoalStatus, number>;
    byPriority: Record<GoalPriority, number>;
    averageProgress: number;
    achievedCount: number;
  }> {
    const goals = await this.getCarePlanGoals(carePlanId);

    const byStatus = {} as Record<GoalStatus, number>;
    const byPriority = {} as Record<GoalPriority, number>;
    let totalProgress = 0;
    let achievedCount = 0;

    for (const goal of goals) {
      byStatus[goal.status] = (byStatus[goal.status] || 0) + 1;
      byPriority[goal.priority] = (byPriority[goal.priority] || 0) + 1;
      totalProgress += goal.progressPercentage;
      if (goal.achievementStatus === 'achieved') {
        achievedCount++;
      }
    }

    return {
      totalGoals: goals.length,
      byStatus,
      byPriority,
      averageProgress: goals.length > 0 ? Math.round(totalProgress / goals.length) : 0,
      achievedCount,
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: GoalStatus,
    newStatus: GoalStatus,
  ): void {
    const allowedTransitions: Record<GoalStatus, GoalStatus[]> = {
      [GoalStatus.PROPOSED]: [GoalStatus.PLANNED, GoalStatus.REJECTED, GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.PLANNED]: [GoalStatus.ACCEPTED, GoalStatus.REJECTED, GoalStatus.CANCELLED, GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.ACCEPTED]: [GoalStatus.ACTIVE, GoalStatus.ON_HOLD, GoalStatus.CANCELLED, GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.ACTIVE]: [GoalStatus.COMPLETED, GoalStatus.ON_HOLD, GoalStatus.CANCELLED, GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.ON_HOLD]: [GoalStatus.ACTIVE, GoalStatus.CANCELLED, GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.COMPLETED]: [GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.CANCELLED]: [GoalStatus.ENTERED_IN_ERROR],
      [GoalStatus.ENTERED_IN_ERROR]: [],
      [GoalStatus.REJECTED]: [GoalStatus.ENTERED_IN_ERROR],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}`,
      );
    }
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
      relatedEntityType: 'Goal',
      relatedEntityId,
      changes,
    });

    await this.revisionRepo.save(revision);
  }
}


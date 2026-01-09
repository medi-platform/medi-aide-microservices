import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MentorshipGoal,
  GoalCategory,
  GoalStatus,
  GoalPriority,
} from '../entities/mentorship-goal.entity';
import {
  MentorshipMilestone,
  MilestoneType,
  MilestoneStatus,
} from '../entities/mentorship-milestone.entity';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectRepository(MentorshipGoal)
    private readonly goalRepo: Repository<MentorshipGoal>,
    @InjectRepository(MentorshipMilestone)
    private readonly milestoneRepo: Repository<MentorshipMilestone>,
  ) {}

  // Goals Management
  async createGoal(dto: {
    mentorshipId: string;
    menteeId: string;
    mentorId: string;
    title: string;
    description?: string;
    category: GoalCategory;
    priority?: GoalPriority;
    targetDate?: Date;
    successCriteria?: any[];
    actionItems?: any[];
  }): Promise<MentorshipGoal> {
    const goal = this.goalRepo.create({
      ...dto,
      status: GoalStatus.ACTIVE,
      priority: dto.priority || GoalPriority.MEDIUM,
    });
    return this.goalRepo.save(goal);
  }

  async getGoal(id: string): Promise<MentorshipGoal> {
    const goal = await this.goalRepo.findOne({ where: { id } });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    return goal;
  }

  async getMentorshipGoals(mentorshipId: string): Promise<MentorshipGoal[]> {
    return this.goalRepo.find({
      where: { mentorshipId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async getMenteeGoals(menteeId: string, status?: GoalStatus): Promise<MentorshipGoal[]> {
    const where: any = { menteeId };
    if (status) where.status = status;
    return this.goalRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateGoalProgress(goalId: string, progressPercentage: number): Promise<MentorshipGoal> {
    const goal = await this.getGoal(goalId);
    goal.progressPercentage = progressPercentage;
    if (progressPercentage >= 100) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedAt = new Date();
    }
    return this.goalRepo.save(goal);
  }

  async completeGoal(goalId: string): Promise<MentorshipGoal> {
    const goal = await this.getGoal(goalId);
    goal.status = GoalStatus.COMPLETED;
    goal.progressPercentage = 100;
    goal.completedAt = new Date();
    return this.goalRepo.save(goal);
  }

  async updateActionItem(
    goalId: string,
    actionItemId: string,
    isCompleted: boolean,
  ): Promise<MentorshipGoal> {
    const goal = await this.getGoal(goalId);
    if (goal.actionItems) {
      const item = goal.actionItems.find(ai => ai.id === actionItemId);
      if (item) {
        item.isCompleted = isCompleted;
        item.completedAt = isCompleted ? new Date() : undefined;
      }
    }
    return this.goalRepo.save(goal);
  }

  // Milestones Management
  async createMilestone(dto: {
    mentorshipId: string;
    menteeId: string;
    goalId?: string;
    title: string;
    description?: string;
    milestoneType: MilestoneType;
    order?: number;
    targetDate?: Date;
    requiresVerification?: boolean;
    pointsAwarded?: number;
  }): Promise<MentorshipMilestone> {
    const milestone = this.milestoneRepo.create({
      ...dto,
      status: MilestoneStatus.PENDING,
      order: dto.order || 1,
    });
    return this.milestoneRepo.save(milestone);
  }

  async getMilestone(id: string): Promise<MentorshipMilestone> {
    const milestone = await this.milestoneRepo.findOne({ where: { id } });
    if (!milestone) throw new NotFoundException(`Milestone ${id} not found`);
    return milestone;
  }

  async getMentorshipMilestones(mentorshipId: string): Promise<MentorshipMilestone[]> {
    return this.milestoneRepo.find({
      where: { mentorshipId },
      order: { order: 'ASC' },
    });
  }

  async getMenteeMilestones(menteeId: string, status?: MilestoneStatus): Promise<MentorshipMilestone[]> {
    const where: any = { menteeId };
    if (status) where.status = status;
    return this.milestoneRepo.find({ where, order: { achievedAt: 'DESC' } });
  }

  async achieveMilestone(
    milestoneId: string,
    verifiedBy?: string,
    verificationNotes?: string,
  ): Promise<MentorshipMilestone> {
    const milestone = await this.getMilestone(milestoneId);
    milestone.status = MilestoneStatus.ACHIEVED;
    milestone.achievedAt = new Date();
    if (milestone.requiresVerification && verifiedBy) {
      milestone.verifiedBy = verifiedBy;
      milestone.verifiedAt = new Date();
      milestone.verificationNotes = verificationNotes;
    }
    return this.milestoneRepo.save(milestone);
  }

  async addEvidence(
    milestoneId: string,
    evidence: {
      type: 'certificate' | 'assessment' | 'observation' | 'document' | 'other';
      description: string;
      url?: string;
    },
  ): Promise<MentorshipMilestone> {
    const milestone = await this.getMilestone(milestoneId);
    const evidenceList = milestone.evidence || [];
    evidenceList.push({
      id: `ev_${Date.now()}`,
      ...evidence,
      uploadedAt: new Date(),
    });
    milestone.evidence = evidenceList;
    return this.milestoneRepo.save(milestone);
  }

  async addFeedback(
    milestoneId: string,
    feedback: { mentorFeedback?: string; menteeReflection?: string },
  ): Promise<MentorshipMilestone> {
    const milestone = await this.getMilestone(milestoneId);
    if (feedback.mentorFeedback) milestone.mentorFeedback = feedback.mentorFeedback;
    if (feedback.menteeReflection) milestone.menteeReflection = feedback.menteeReflection;
    return this.milestoneRepo.save(milestone);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverTraining, TrainingStatus } from '../entities/caregiver-training.entity';
import { CaregiverGoal, GoalStatus } from '../entities/caregiver-goal.entity';
import { CaregiverReviewCycle, ReviewCycleStatus } from '../entities/caregiver-review-cycle.entity';

@Injectable()
export class CaregiverTrainingDevelopmentService {
  constructor(
    @InjectRepository(CaregiverTraining)
    private readonly trainingRepository: Repository<CaregiverTraining>,
    @InjectRepository(CaregiverGoal)
    private readonly goalRepository: Repository<CaregiverGoal>,
    @InjectRepository(CaregiverReviewCycle)
    private readonly reviewCycleRepository: Repository<CaregiverReviewCycle>,
  ) {}

  // ===== TRAINING =====

  async enrollInTraining(data: Partial<CaregiverTraining>): Promise<CaregiverTraining> {
    const training = this.trainingRepository.create({
      ...data,
      status: TrainingStatus.NOT_STARTED,
      progressPercentage: 0,
      attemptsCount: 0,
    });
    return this.trainingRepository.save(training);
  }

  async getTraining(id: string): Promise<CaregiverTraining> {
    const training = await this.trainingRepository.findOne({ where: { id } });
    if (!training) {
      throw new NotFoundException(`Training record ${id} not found`);
    }
    return training;
  }

  async startTraining(id: string): Promise<CaregiverTraining> {
    const training = await this.getTraining(id);
    training.status = TrainingStatus.IN_PROGRESS;
    training.startedAt = new Date();
    training.attemptsCount += 1;
    return this.trainingRepository.save(training);
  }

  async updateTrainingProgress(id: string, progress: number): Promise<CaregiverTraining> {
    const training = await this.getTraining(id);
    training.progressPercentage = Math.min(100, Math.max(0, progress));
    return this.trainingRepository.save(training);
  }

  async completeTraining(
    id: string,
    score?: number,
    certificateNumber?: string,
  ): Promise<CaregiverTraining> {
    const training = await this.getTraining(id);
    
    if (score !== undefined) {
      training.score = score;
      if (training.passingScore && score < training.passingScore) {
        training.status = TrainingStatus.FAILED;
        return this.trainingRepository.save(training);
      }
    }
    
    training.status = TrainingStatus.COMPLETED;
    training.completedAt = new Date();
    training.progressPercentage = 100;
    if (certificateNumber) {
      training.certificateNumber = certificateNumber;
    }
    
    return this.trainingRepository.save(training);
  }

  async listCaregiverTrainings(
    caregiverId: string,
    status?: TrainingStatus,
  ): Promise<CaregiverTraining[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.trainingRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async listExpiredTrainings(caregiverId: string): Promise<CaregiverTraining[]> {
    return this.trainingRepository
      .createQueryBuilder('training')
      .where('training.caregiverId = :caregiverId', { caregiverId })
      .andWhere('training.expiresAt < :now', { now: new Date() })
      .andWhere('training.status = :status', { status: TrainingStatus.COMPLETED })
      .getMany();
  }

  // ===== GOALS =====

  async createGoal(data: Partial<CaregiverGoal>): Promise<CaregiverGoal> {
    const goal = this.goalRepository.create(data);
    return this.goalRepository.save(goal);
  }

  async getGoal(id: string): Promise<CaregiverGoal> {
    const goal = await this.goalRepository.findOne({ where: { id } });
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }
    return goal;
  }

  async updateGoal(id: string, data: Partial<CaregiverGoal>): Promise<CaregiverGoal> {
    const goal = await this.getGoal(id);
    Object.assign(goal, data);
    return this.goalRepository.save(goal);
  }

  async updateGoalProgress(id: string, progress: number): Promise<CaregiverGoal> {
    const goal = await this.getGoal(id);
    goal.progressPercentage = Math.min(100, Math.max(0, progress));
    
    // Auto-update status based on progress
    if (progress === 100) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedDate = new Date();
    } else if (progress > 0 && goal.status === GoalStatus.NOT_STARTED) {
      goal.status = GoalStatus.IN_PROGRESS;
    }
    
    return this.goalRepository.save(goal);
  }

  async completeGoal(id: string, notes?: string): Promise<CaregiverGoal> {
    const goal = await this.getGoal(id);
    goal.status = GoalStatus.COMPLETED;
    goal.progressPercentage = 100;
    goal.completedDate = new Date();
    if (notes) {
      goal.completionNotes = notes;
    }
    return this.goalRepository.save(goal);
  }

  async listCaregiverGoals(
    caregiverId: string,
    status?: GoalStatus,
  ): Promise<CaregiverGoal[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.goalRepository.find({
      where,
      order: { dueDate: 'ASC' },
    });
  }

  // ===== REVIEW CYCLES =====

  async scheduleReviewCycle(data: Partial<CaregiverReviewCycle>): Promise<CaregiverReviewCycle> {
    const reviewCycle = this.reviewCycleRepository.create({
      ...data,
      status: ReviewCycleStatus.SCHEDULED,
    });
    return this.reviewCycleRepository.save(reviewCycle);
  }

  async getReviewCycle(id: string): Promise<CaregiverReviewCycle> {
    const reviewCycle = await this.reviewCycleRepository.findOne({ where: { id } });
    if (!reviewCycle) {
      throw new NotFoundException(`Review cycle ${id} not found`);
    }
    return reviewCycle;
  }

  async startReviewCycle(id: string): Promise<CaregiverReviewCycle> {
    const reviewCycle = await this.getReviewCycle(id);
    reviewCycle.status = ReviewCycleStatus.IN_PROGRESS;
    return this.reviewCycleRepository.save(reviewCycle);
  }

  async submitSelfAssessment(id: string, assessment: string): Promise<CaregiverReviewCycle> {
    const reviewCycle = await this.getReviewCycle(id);
    reviewCycle.selfAssessment = assessment;
    reviewCycle.selfAssessmentSubmittedAt = new Date();
    return this.reviewCycleRepository.save(reviewCycle);
  }

  async submitManagerAssessment(
    id: string,
    assessment: string,
    score: number,
    strengths: string[],
    areasForImprovement: string[],
    developmentPlan?: string,
  ): Promise<CaregiverReviewCycle> {
    const reviewCycle = await this.getReviewCycle(id);
    reviewCycle.managerAssessment = assessment;
    reviewCycle.overallScore = score;
    reviewCycle.strengths = strengths;
    reviewCycle.areasForImprovement = areasForImprovement;
    if (developmentPlan) {
      reviewCycle.developmentPlan = developmentPlan;
    }
    reviewCycle.status = ReviewCycleStatus.PENDING_REVIEW;
    return this.reviewCycleRepository.save(reviewCycle);
  }

  async acknowledgeReview(id: string, comments?: string): Promise<CaregiverReviewCycle> {
    const reviewCycle = await this.getReviewCycle(id);
    reviewCycle.acknowledgedAt = new Date();
    if (comments) {
      reviewCycle.caregiverComments = comments;
    }
    reviewCycle.status = ReviewCycleStatus.COMPLETED;
    return this.reviewCycleRepository.save(reviewCycle);
  }

  async listCaregiverReviewCycles(
    caregiverId: string,
    status?: ReviewCycleStatus,
  ): Promise<CaregiverReviewCycle[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }
    return this.reviewCycleRepository.find({
      where,
      order: { reviewDate: 'DESC' },
    });
  }
}

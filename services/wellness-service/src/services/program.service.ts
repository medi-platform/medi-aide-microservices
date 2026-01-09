import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  WellnessProgram,
  ProgramType,
  ProgramStatus,
} from '../entities/wellness-program.entity';
import {
  WellnessActivity,
  ActivityType,
  ActivityDifficulty,
} from '../entities/wellness-activity.entity';
import {
  WellnessChallenge,
  ChallengeType,
  ChallengeStatus,
  ChallengeScope,
} from '../entities/wellness-challenge.entity';

@Injectable()
export class ProgramService {
  private readonly logger = new Logger(ProgramService.name);

  constructor(
    @InjectRepository(WellnessProgram)
    private readonly programRepo: Repository<WellnessProgram>,
    @InjectRepository(WellnessActivity)
    private readonly activityRepo: Repository<WellnessActivity>,
    @InjectRepository(WellnessChallenge)
    private readonly challengeRepo: Repository<WellnessChallenge>,
  ) {}

  // Program Management
  async createProgram(dto: {
    title: string;
    titleFr?: string;
    description?: string;
    programType: ProgramType;
    createdBy: string;
    agencyId?: string;
    durationDays: number;
    weeklyCommitmentMinutes?: number;
    pointsOnCompletion?: number;
  }): Promise<WellnessProgram> {
    const program = this.programRepo.create({
      ...dto,
      status: ProgramStatus.DRAFT,
    });
    return this.programRepo.save(program);
  }

  async getProgram(id: string): Promise<WellnessProgram> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException(`Program ${id} not found`);
    return program;
  }

  async listPrograms(
    programType?: ProgramType,
    status?: ProgramStatus,
    agencyId?: string,
  ): Promise<WellnessProgram[]> {
    const where: any = {};
    if (programType) where.programType = programType;
    if (status) where.status = status;
    if (agencyId) where.agencyId = agencyId;
    return this.programRepo.find({ where, order: { title: 'ASC' } });
  }

  async publishProgram(id: string): Promise<WellnessProgram> {
    const program = await this.getProgram(id);
    program.status = ProgramStatus.ACTIVE;
    return this.programRepo.save(program);
  }

  // Activity Management
  async createActivity(dto: {
    programId?: string;
    phaseId?: string;
    title: string;
    titleFr?: string;
    description?: string;
    activityType: ActivityType;
    difficulty?: ActivityDifficulty;
    order?: number;
    durationMinutes: number;
    content?: any;
    pointsOnCompletion?: number;
  }): Promise<WellnessActivity> {
    const activity = this.activityRepo.create({
      ...dto,
      difficulty: dto.difficulty || ActivityDifficulty.EASY,
      order: dto.order || 0,
    });
    return this.activityRepo.save(activity);
  }

  async getActivity(id: string): Promise<WellnessActivity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async getProgramActivities(programId: string): Promise<WellnessActivity[]> {
    return this.activityRepo.find({
      where: { programId, isActive: true },
      order: { order: 'ASC' },
    });
  }

  async getStandaloneActivities(activityType?: ActivityType): Promise<WellnessActivity[]> {
    const where: any = { programId: null as any, isActive: true };
    if (activityType) where.activityType = activityType;
    return this.activityRepo.find({ where, order: { title: 'ASC' } });
  }

  // Challenge Management
  async createChallenge(dto: {
    title: string;
    titleFr?: string;
    description?: string;
    challengeType: ChallengeType;
    scope?: ChallengeScope;
    createdBy: string;
    agencyId?: string;
    startDate: Date;
    endDate: Date;
    targetValue: number;
    unit: string;
    pointsOnCompletion?: number;
  }): Promise<WellnessChallenge> {
    const challenge = this.challengeRepo.create({
      ...dto,
      status: ChallengeStatus.UPCOMING,
      scope: dto.scope || ChallengeScope.PLATFORM,
    });
    return this.challengeRepo.save(challenge);
  }

  async getChallenge(id: string): Promise<WellnessChallenge> {
    const challenge = await this.challengeRepo.findOne({ where: { id } });
    if (!challenge) throw new NotFoundException(`Challenge ${id} not found`);
    return challenge;
  }

  async listChallenges(
    status?: ChallengeStatus,
    challengeType?: ChallengeType,
    agencyId?: string,
  ): Promise<WellnessChallenge[]> {
    const where: any = {};
    if (status) where.status = status;
    if (challengeType) where.challengeType = challengeType;
    if (agencyId) where.agencyId = agencyId;
    return this.challengeRepo.find({ where, order: { startDate: 'DESC' } });
  }

  async getActiveChallenges(): Promise<WellnessChallenge[]> {
    const now = new Date();
    return this.challengeRepo.find({
      where: {
        status: ChallengeStatus.ACTIVE,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { endDate: 'ASC' },
    });
  }

  async startChallenge(id: string): Promise<WellnessChallenge> {
    const challenge = await this.getChallenge(id);
    challenge.status = ChallengeStatus.ACTIVE;
    return this.challengeRepo.save(challenge);
  }

  async completeChallenge(id: string): Promise<WellnessChallenge> {
    const challenge = await this.getChallenge(id);
    challenge.status = ChallengeStatus.COMPLETED;
    return this.challengeRepo.save(challenge);
  }

  async joinChallenge(challengeId: string): Promise<WellnessChallenge> {
    const challenge = await this.getChallenge(challengeId);
    challenge.participantCount++;
    return this.challengeRepo.save(challenge);
  }

  async updateChallengeProgress(
    challengeId: string,
    progressIncrement: number,
  ): Promise<WellnessChallenge> {
    const challenge = await this.getChallenge(challengeId);
    challenge.totalProgress = Number(challenge.totalProgress) + progressIncrement;
    return this.challengeRepo.save(challenge);
  }
}

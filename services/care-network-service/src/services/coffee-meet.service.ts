import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CoffeeMeet, CoffeeMeetStatus } from '../entities/coffee-meet.entity';
import { CoffeeMeetParticipant, CoffeeMeetParticipantStatus } from '../entities/coffee-meet-participant.entity';
import { GroupMember, GroupMemberStatus } from '../entities/group-member.entity';

export interface CreateCoffeeMeetInput {
  topic: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes?: number;
  createdBy: string;
  groupId?: string;
  meetingProvider?: string;
  meetingUrl?: string;
  maxParticipants?: number;
}

@Injectable()
export class CoffeeMeetService {
  private readonly logger = new Logger(CoffeeMeetService.name);

  constructor(
    @InjectRepository(CoffeeMeet)
    private readonly meetRepo: Repository<CoffeeMeet>,
    @InjectRepository(CoffeeMeetParticipant)
    private readonly participantRepo: Repository<CoffeeMeetParticipant>,
    @InjectRepository(GroupMember)
    private readonly memberRepo: Repository<GroupMember>,
  ) {}

  async createMeet(input: CreateCoffeeMeetInput): Promise<{ meet: CoffeeMeet; participants: CoffeeMeetParticipant[] }> {
    if (!input.topic?.trim()) throw new BadRequestException('topic is required');

    if (input.scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    if (input.groupId) {
      // Ensure creator is an active member of the group
      const member = await this.memberRepo.findOne({ where: { groupId: input.groupId, userId: input.createdBy } });
      if (!member || member.status !== GroupMemberStatus.ACTIVE) {
        throw new ForbiddenException('Must be an active group member to create a CoffeeMeet in this group');
      }
    }

    const meet = this.meetRepo.create({
      topic: input.topic.trim(),
      description: input.description,
      scheduledAt: input.scheduledAt,
      durationMinutes: Math.min(Math.max(input.durationMinutes ?? 30, 15), 180),
      status: CoffeeMeetStatus.SCHEDULED,
      createdBy: input.createdBy,
      groupId: input.groupId,
      meetingProvider: input.meetingProvider ?? 'custom',
      meetingUrl: input.meetingUrl,
      maxParticipants: Math.min(Math.max(input.maxParticipants ?? 4, 2), 12),
    });
    const saved = await this.meetRepo.save(meet);

    // Auto-add creator as participant
    const creatorParticipant = this.participantRepo.create({
      coffeeMeetId: saved.id,
      userId: input.createdBy,
      status: CoffeeMeetParticipantStatus.ACCEPTED,
      joinedAt: new Date(),
    });
    const participant = await this.participantRepo.save(creatorParticipant);

    this.logger.log(`CoffeeMeet created: ${saved.id}`);
    return { meet: saved, participants: [participant] };
  }

  async getMeet(meetId: string): Promise<CoffeeMeet> {
    const meet = await this.meetRepo.findOne({ where: { id: meetId } });
    if (!meet) throw new NotFoundException(`CoffeeMeet ${meetId} not found`);
    return meet;
  }

  async listMeets(options?: {
    groupId?: string;
    userId?: string;
    status?: CoffeeMeetStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: CoffeeMeet[]; total: number }> {
    const where: any = {};
    if (options?.groupId) where.groupId = options.groupId;
    if (options?.status) where.status = options.status;

    // If userId is specified, we filter by participation (2-step query)
    if (options?.userId) {
      const participantRows = await this.participantRepo.find({
        where: { userId: options.userId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });
      const meetIds = participantRows.map(p => p.coffeeMeetId);
      if (meetIds.length === 0) return { data: [], total: 0 };
      where.id = In(meetIds);
    }

    const [data, total] = await this.meetRepo.findAndCount({
      where,
      order: { scheduledAt: 'ASC' },
      take: Math.min(Math.max(options?.limit ?? 25, 1), 100),
      skip: Math.max(options?.offset ?? 0, 0),
    });

    return { data, total };
  }

  async joinMeet(meetId: string, userId: string): Promise<CoffeeMeetParticipant> {
    const meet = await this.getMeet(meetId);
    if (meet.status !== CoffeeMeetStatus.SCHEDULED) {
      throw new BadRequestException('CoffeeMeet is not open for joining');
    }

    // Capacity check
    const activeCount = await this.participantRepo.count({
      where: { coffeeMeetId: meetId, status: In([CoffeeMeetParticipantStatus.ACCEPTED, CoffeeMeetParticipantStatus.INVITED]) },
    });
    if (activeCount >= meet.maxParticipants) {
      throw new ConflictException('CoffeeMeet is full');
    }

    // Group membership check if meet is group-bound
    if (meet.groupId) {
      const member = await this.memberRepo.findOne({ where: { groupId: meet.groupId, userId } });
      if (!member || member.status !== GroupMemberStatus.ACTIVE) {
        throw new ForbiddenException('Must be an active group member to join this CoffeeMeet');
      }
    }

    const existing = await this.participantRepo.findOne({ where: { coffeeMeetId: meetId, userId } });
    if (existing && existing.status !== CoffeeMeetParticipantStatus.REMOVED) {
      throw new ConflictException('Already joined');
    }

    const participant = existing
      ? Object.assign(existing, { status: CoffeeMeetParticipantStatus.ACCEPTED, joinedAt: new Date() })
      : this.participantRepo.create({
          coffeeMeetId: meetId,
          userId,
          status: CoffeeMeetParticipantStatus.ACCEPTED,
          joinedAt: new Date(),
        });

    return this.participantRepo.save(participant);
  }

  async listParticipants(meetId: string): Promise<CoffeeMeetParticipant[]> {
    await this.getMeet(meetId);
    return this.participantRepo.find({
      where: { coffeeMeetId: meetId },
      order: { joinedAt: 'ASC', createdAt: 'ASC' },
      take: 100,
    });
  }
}



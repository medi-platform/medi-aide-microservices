import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MentorshipRequest,
  MentorshipRequestStatus,
  MentorshipRequirements,
} from '../entities/mentorship-request.entity';
import { MentorshipMatch, MentorshipMatchStatus } from '../entities/mentorship-match.entity';
import { Mentorship, MentorshipStatus } from '../entities/mentorship.entity';
import { MentorshipMatchingService } from './mentorship-matching.service';

@Injectable()
export class MentorshipService {
  private readonly logger = new Logger(MentorshipService.name);

  constructor(
    @InjectRepository(MentorshipRequest)
    private readonly requestRepo: Repository<MentorshipRequest>,
    @InjectRepository(MentorshipMatch)
    private readonly matchRepo: Repository<MentorshipMatch>,
    @InjectRepository(Mentorship)
    private readonly mentorshipRepo: Repository<Mentorship>,
    private readonly matching: MentorshipMatchingService,
  ) {}

  async createRequest(
    menteeId: string,
    requirements: MentorshipRequirements,
  ): Promise<{ request: MentorshipRequest; matches: MentorshipMatch[] }> {
    const request = this.requestRepo.create({
      menteeId,
      requirements,
      status: MentorshipRequestStatus.PENDING,
      matchCount: 0,
    });
    await this.requestRepo.save(request);

    const candidates = await this.matching.generateMatches(menteeId, requirements, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const matchEntities: MentorshipMatch[] = [];
    for (const c of candidates) {
      matchEntities.push(
        this.matchRepo.create({
          requestId: request.id,
          mentorProfileId: c.mentorProfile.id,
          mentorUserId: c.mentorProfile.userId,
          score: c.score,
          scoreBreakdown: c.scoreBreakdown,
          explanation: c.explanation,
          status: MentorshipMatchStatus.SUGGESTED,
          expiresAt,
        }),
      );
    }

    const savedMatches = await this.matchRepo.save(matchEntities);

    request.status = savedMatches.length > 0 ? MentorshipRequestStatus.MATCHED : MentorshipRequestStatus.PENDING;
    request.matchCount = savedMatches.length;
    await this.requestRepo.save(request);

    this.logger.log(`Mentorship request ${request.id} created for mentee ${menteeId} with ${savedMatches.length} matches`);

    return { request, matches: savedMatches };
  }

  async getRequest(requestId: string, requesterUserId?: string): Promise<{ request: MentorshipRequest; matches: MentorshipMatch[] }> {
    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException(`Mentorship request ${requestId} not found`);

    if (requesterUserId && request.menteeId !== requesterUserId) {
      throw new ForbiddenException('Not allowed to view this mentorship request');
    }

    const matches = await this.matchRepo.find({
      where: { requestId: request.id },
      order: { score: 'DESC', createdAt: 'ASC' },
    });

    return { request, matches };
  }

  async acceptMatch(matchId: string, menteeId: string): Promise<Mentorship> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);

    const request = await this.requestRepo.findOne({ where: { id: match.requestId } });
    if (!request) throw new NotFoundException(`Request ${match.requestId} not found`);

    if (request.menteeId !== menteeId) {
      throw new ForbiddenException('Not allowed to accept a match for this request');
    }

    if (match.status === MentorshipMatchStatus.ACCEPTED) {
      throw new BadRequestException('Match is already accepted');
    }
    if (match.expiresAt && match.expiresAt < new Date()) {
      match.status = MentorshipMatchStatus.EXPIRED;
      await this.matchRepo.save(match);
      throw new BadRequestException('Match has expired');
    }

    // Mark match accepted
    match.status = MentorshipMatchStatus.ACCEPTED;
    await this.matchRepo.save(match);

    // Expire other matches for the request
    await this.matchRepo.update(
      { requestId: request.id },
      { status: MentorshipMatchStatus.EXPIRED },
    );
    await this.matchRepo.update({ id: match.id }, { status: MentorshipMatchStatus.ACCEPTED });

    // Create mentorship relationship
    const mentorship = this.mentorshipRepo.create({
      mentorUserId: match.mentorUserId,
      menteeUserId: menteeId,
      requestId: request.id,
      status: MentorshipStatus.ACTIVE,
      goals: request.requirements?.goals,
      startedAt: new Date(),
    });
    const saved = await this.mentorshipRepo.save(mentorship);

    request.status = MentorshipRequestStatus.ACTIVE;
    await this.requestRepo.save(request);

    this.logger.log(`Mentorship ${saved.id} created: mentor=${saved.mentorUserId} mentee=${saved.menteeUserId}`);

    return saved;
  }

  async listMentorshipsForUser(userId: string): Promise<Mentorship[]> {
    return this.mentorshipRepo.find({
      where: [
        { mentorUserId: userId },
        { menteeUserId: userId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async completeMentorship(mentorshipId: string, userId: string, notes?: string): Promise<Mentorship> {
    const mentorship = await this.mentorshipRepo.findOne({ where: { id: mentorshipId } });
    if (!mentorship) throw new NotFoundException(`Mentorship ${mentorshipId} not found`);

    if (mentorship.mentorUserId !== userId && mentorship.menteeUserId !== userId) {
      throw new ForbiddenException('Not allowed to update this mentorship');
    }

    mentorship.status = MentorshipStatus.COMPLETED;
    mentorship.endedAt = new Date();
    mentorship.notes = notes ?? mentorship.notes;

    return this.mentorshipRepo.save(mentorship);
  }
}



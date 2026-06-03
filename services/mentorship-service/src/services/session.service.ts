import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentorship } from '../entities/mentorship.entity';
import { MentorshipSession, MentorshipSessionStatus } from '../entities/mentorship-session.entity';

export interface ScheduleSessionInput {
  mentorshipId: string;
  scheduledAt: Date;
  durationMinutes?: number;
  createdBy: string;
  meetingProvider?: string;
  meetingUrl?: string;
  agenda?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(MentorshipSession)
    private readonly sessionRepo: Repository<MentorshipSession>,
    @InjectRepository(Mentorship)
    private readonly mentorshipRepo: Repository<Mentorship>,
  ) {}

  async scheduleSession(input: ScheduleSessionInput): Promise<MentorshipSession> {
    const mentorship = await this.mentorshipRepo.findOne({ where: { id: input.mentorshipId } });
    if (!mentorship) throw new NotFoundException(`Mentorship ${input.mentorshipId} not found`);

    if (mentorship.mentorUserId !== input.createdBy && mentorship.menteeUserId !== input.createdBy) {
      throw new ForbiddenException('Not allowed to schedule sessions for this mentorship');
    }

    if (input.scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const session = this.sessionRepo.create({
      mentorshipId: input.mentorshipId,
      scheduledAt: input.scheduledAt,
      durationMinutes: Math.min(Math.max(input.durationMinutes ?? 30, 15), 240),
      createdBy: input.createdBy,
      meetingProvider: input.meetingProvider ?? 'custom',
      meetingUrl: input.meetingUrl,
      agenda: input.agenda,
      status: MentorshipSessionStatus.SCHEDULED,
    });

    const saved = await this.sessionRepo.save(session);
    this.logger.log(`Mentorship session scheduled: ${saved.id}`);
    return saved;
  }

  async completeSession(sessionId: string, userId: string, notes?: string): Promise<MentorshipSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const mentorship = await this.mentorshipRepo.findOne({ where: { id: session.mentorshipId } });
    if (!mentorship) throw new NotFoundException(`Mentorship ${session.mentorshipId} not found`);

    if (mentorship.mentorUserId !== userId && mentorship.menteeUserId !== userId) {
      throw new ForbiddenException('Not allowed to complete this session');
    }

    if (session.status !== MentorshipSessionStatus.SCHEDULED) {
      throw new BadRequestException(`Session is not schedulable/completable from status ${session.status}`);
    }

    session.status = MentorshipSessionStatus.COMPLETED;
    session.completedAt = new Date();
    session.notes = notes ?? session.notes;

    return this.sessionRepo.save(session);
  }

  async listSessions(mentorshipId: string, userId: string): Promise<MentorshipSession[]> {
    const mentorship = await this.mentorshipRepo.findOne({ where: { id: mentorshipId } });
    if (!mentorship) throw new NotFoundException(`Mentorship ${mentorshipId} not found`);

    if (mentorship.mentorUserId !== userId && mentorship.menteeUserId !== userId) {
      throw new ForbiddenException('Not allowed to view sessions for this mentorship');
    }

    return this.sessionRepo.find({
      where: { mentorshipId },
      order: { scheduledAt: 'ASC' },
    });
  }
}



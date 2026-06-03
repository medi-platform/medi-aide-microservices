import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import {
  AgencyInterview,
  InterviewStatus,
  InterviewType,
  InterviewRecommendation,
} from '../entities/agency-interview.entity';
import { AgencyJobApplication, ApplicationStatus } from '../entities/agency-job-application.entity';

export interface ScheduleInterviewDto {
  application_id: string;
  agency_id: string;
  interviewer_user_id: string;
  scheduled_at: Date;
  duration_minutes?: number;
  timezone?: string;
  interview_type?: InterviewType;
  meeting_link?: string;
  location_address?: string;
  location_city?: string;
  location_province?: string;
  instructions?: string;
  template_name?: string;
  created_by?: string;
}

export interface RescheduleInterviewDto {
  scheduled_at: Date;
  duration_minutes?: number;
  interview_type?: InterviewType;
  meeting_link?: string;
  instructions?: string;
}

export interface SubmitFeedbackDto {
  overall_rating: number;
  communication_rating?: number;
  professionalism_rating?: number;
  experience_rating?: number;
  cultural_fit_rating?: number;
  recommendation: InterviewRecommendation;
  strengths?: string;
  concerns?: string;
  notes?: string;
  internal_notes?: string;
  questions_asked?: {
    question: string;
    answer_notes?: string;
    rating?: number;
  }[];
}

/**
 * InterviewService
 * 
 * Manages interview scheduling, feedback, and outcomes.
 */
@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    @InjectRepository(AgencyInterview)
    private readonly interviewRepo: Repository<AgencyInterview>,
    @InjectRepository(AgencyJobApplication)
    private readonly applicationRepo: Repository<AgencyJobApplication>,
  ) {}

  async scheduleInterview(dto: ScheduleInterviewDto): Promise<AgencyInterview> {
    this.logger.log(`Scheduling interview for application ${dto.application_id}`);

    // Validate application exists and is in correct state
    const application = await this.applicationRepo.findOne({
      where: { id: dto.application_id },
    });

    if (!application) {
      throw new NotFoundException(`Application ${dto.application_id} not found`);
    }

    // Check for conflicting interviews
    const conflicting = await this.interviewRepo.findOne({
      where: {
        interviewer_user_id: dto.interviewer_user_id,
        scheduled_at: dto.scheduled_at,
        status: InterviewStatus.SCHEDULED,
      },
    });

    if (conflicting) {
      throw new BadRequestException('Interviewer has a conflicting interview at this time');
    }

    const interview = this.interviewRepo.create({
      ...dto,
      status: InterviewStatus.SCHEDULED,
      duration_minutes: dto.duration_minutes || 30,
      interview_type: dto.interview_type || InterviewType.VIDEO,
    });

    const saved = await this.interviewRepo.save(interview);

    // Update application status
    application.status = ApplicationStatus.INTERVIEW_SCHEDULED;
    application.interview_scheduled_at = new Date();
    await this.applicationRepo.save(application);

    return saved;
  }

  async getInterviewById(id: string): Promise<AgencyInterview> {
    const interview = await this.interviewRepo.findOne({
      where: { id },
      relations: ['application'],
    });
    if (!interview) {
      throw new NotFoundException(`Interview ${id} not found`);
    }
    return interview;
  }

  async listInterviews(
    filter: {
      agency_id?: string;
      interviewer_user_id?: string;
      application_id?: string;
      status?: InterviewStatus;
      from_date?: Date;
      to_date?: Date;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: AgencyInterview[]; total: number }> {
    const where: FindOptionsWhere<AgencyInterview> = {};

    if (filter.agency_id) where.agency_id = filter.agency_id;
    if (filter.interviewer_user_id) where.interviewer_user_id = filter.interviewer_user_id;
    if (filter.application_id) where.application_id = filter.application_id;
    if (filter.status) where.status = filter.status;

    if (filter.from_date && filter.to_date) {
      where.scheduled_at = Between(filter.from_date, filter.to_date);
    }

    const [data, total] = await this.interviewRepo.findAndCount({
      where,
      order: { scheduled_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['application'],
    });

    return { data, total };
  }

  async confirmInterview(id: string): Promise<AgencyInterview> {
    const interview = await this.getInterviewById(id);

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException('Can only confirm scheduled interviews');
    }

    interview.status = InterviewStatus.CONFIRMED;
    interview.confirmed_at = new Date();

    return this.interviewRepo.save(interview);
  }

  async rescheduleInterview(id: string, dto: RescheduleInterviewDto): Promise<AgencyInterview> {
    const interview = await this.getInterviewById(id);

    if ([InterviewStatus.COMPLETED, InterviewStatus.CANCELLED].includes(interview.status)) {
      throw new BadRequestException('Cannot reschedule completed or cancelled interviews');
    }

    interview.rescheduled_from = interview.scheduled_at;
    interview.scheduled_at = dto.scheduled_at;
    interview.status = InterviewStatus.RESCHEDULED;

    if (dto.duration_minutes) interview.duration_minutes = dto.duration_minutes;
    if (dto.interview_type) interview.interview_type = dto.interview_type;
    if (dto.meeting_link) interview.meeting_link = dto.meeting_link;
    if (dto.instructions) interview.instructions = dto.instructions;

    return this.interviewRepo.save(interview);
  }

  async cancelInterview(
    id: string,
    cancelledBy: string,
    reason?: string,
  ): Promise<AgencyInterview> {
    const interview = await this.getInterviewById(id);

    if ([InterviewStatus.COMPLETED, InterviewStatus.CANCELLED].includes(interview.status)) {
      throw new BadRequestException('Interview is already completed or cancelled');
    }

    interview.status = InterviewStatus.CANCELLED;
    interview.cancelled_at = new Date();
    interview.cancelled_by = cancelledBy;
    interview.cancellation_reason = reason;

    return this.interviewRepo.save(interview);
  }

  async markNoShow(id: string): Promise<AgencyInterview> {
    const interview = await this.getInterviewById(id);

    interview.status = InterviewStatus.NO_SHOW;

    return this.interviewRepo.save(interview);
  }

  async submitFeedback(id: string, dto: SubmitFeedbackDto): Promise<AgencyInterview> {
    const interview = await this.getInterviewById(id);

    if (interview.status !== InterviewStatus.CONFIRMED && interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException('Can only submit feedback for confirmed or scheduled interviews');
    }

    interview.status = InterviewStatus.COMPLETED;
    interview.completed_at = new Date();
    interview.overall_rating = dto.overall_rating;
    interview.communication_rating = dto.communication_rating;
    interview.professionalism_rating = dto.professionalism_rating;
    interview.experience_rating = dto.experience_rating;
    interview.cultural_fit_rating = dto.cultural_fit_rating;
    interview.recommendation = dto.recommendation;
    interview.strengths = dto.strengths;
    interview.concerns = dto.concerns;
    interview.notes = dto.notes;
    interview.internal_notes = dto.internal_notes;
    interview.questions_asked = dto.questions_asked;

    const saved = await this.interviewRepo.save(interview);

    // Update application status
    const application = await this.applicationRepo.findOne({
      where: { id: interview.application_id },
    });

    if (application) {
      application.status = ApplicationStatus.INTERVIEWED;
      application.interviewed_at = new Date();
      await this.applicationRepo.save(application);
    }

    return saved;
  }

  async getUpcomingInterviews(
    userId: string,
    role: 'interviewer' | 'candidate',
    days = 7,
  ): Promise<AgencyInterview[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const where: FindOptionsWhere<AgencyInterview> = {
      scheduled_at: Between(now, future),
      status: InterviewStatus.SCHEDULED,
    };

    if (role === 'interviewer') {
      where.interviewer_user_id = userId;
    }

    return this.interviewRepo.find({
      where,
      order: { scheduled_at: 'ASC' },
      relations: ['application'],
    });
  }

  async sendReminder(id: string): Promise<AgencyInterview> {
    const interview = await this.getInterviewById(id);

    interview.reminder_sent = true;
    interview.reminder_sent_at = new Date();

    // TODO: Integrate with notification service to send actual reminder

    return this.interviewRepo.save(interview);
  }
}

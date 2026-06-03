import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import {
  AgencyJobPosting,
  JobPostingStatus,
  JobType,
  PayType,
} from '../entities/agency-job-posting.entity';
import {
  AgencyJobApplication,
  ApplicationStatus,
} from '../entities/agency-job-application.entity';

export interface CreateJobPostingDto {
  agency_id: string;
  title: string;
  description?: string;
  responsibilities?: string;
  qualifications?: string;
  benefits?: string;
  job_type?: JobType;
  pay_rate_min?: number;
  pay_rate_max?: number;
  pay_type?: PayType;
  location_city?: string;
  location_province?: string;
  location_postal_code?: string;
  is_remote?: boolean;
  service_radius_km?: number;
  required_credentials?: string[];
  required_certifications?: string[];
  preferred_languages?: string[];
  specializations?: string[];
  experience_years_min?: number;
  requires_drivers_license?: boolean;
  requires_own_vehicle?: boolean;
  weekly_hours_min?: number;
  weekly_hours_max?: number;
  schedule_requirements?: string[];
  start_date?: Date;
  positions_available?: number;
  expires_at?: Date;
  created_by?: string;
}

export interface UpdateJobPostingDto extends Partial<CreateJobPostingDto> {
  status?: JobPostingStatus;
  is_visible?: boolean;
  is_featured?: boolean;
}

export interface JobPostingFilter {
  agency_id?: string;
  status?: JobPostingStatus | JobPostingStatus[];
  job_type?: JobType;
  location_province?: string;
  is_remote?: boolean;
  search?: string;
}

export interface SubmitApplicationDto {
  job_posting_id: string;
  caregiver_id: string;
  cover_letter?: string;
  custom_answers?: Record<string, string>;
  availability_submitted?: {
    start_date?: string;
    hours_per_week?: number;
    schedule_preference?: string[];
  };
  expected_rate?: number;
  source?: string;
  referral_code?: string;
}

/**
 * JobPostingService
 *
 * Manages job postings and applications for agency caregiver recruitment.
 */
@Injectable()
export class JobPostingService {
  private readonly logger = new Logger(JobPostingService.name);

  constructor(
    @InjectRepository(AgencyJobPosting)
    private readonly jobPostingRepo: Repository<AgencyJobPosting>,
    @InjectRepository(AgencyJobApplication)
    private readonly applicationRepo: Repository<AgencyJobApplication>,
  ) {}

  // ===========================================================================
  // Job Postings
  // ===========================================================================

  async createJobPosting(dto: CreateJobPostingDto): Promise<AgencyJobPosting> {
    this.logger.log(`Creating job posting for agency ${dto.agency_id}`);

    const posting = this.jobPostingRepo.create({
      ...dto,
      status: JobPostingStatus.DRAFT,
      applications_count: 0,
      views_count: 0,
      positions_filled: 0,
    });

    return this.jobPostingRepo.save(posting);
  }

  async updateJobPosting(id: string, dto: UpdateJobPostingDto): Promise<AgencyJobPosting> {
    const posting = await this.getJobPostingById(id);

    // Cannot edit closed or expired postings
    if ([JobPostingStatus.CLOSED, JobPostingStatus.EXPIRED].includes(posting.status)) {
      throw new BadRequestException('Cannot edit closed or expired job postings');
    }

    Object.assign(posting, dto);
    return this.jobPostingRepo.save(posting);
  }

  async getJobPostingById(id: string): Promise<AgencyJobPosting> {
    const posting = await this.jobPostingRepo.findOne({ where: { id } });
    if (!posting) {
      throw new NotFoundException(`Job posting ${id} not found`);
    }
    return posting;
  }

  async listJobPostings(
    filter: JobPostingFilter,
    page = 1,
    limit = 20,
  ): Promise<{ data: AgencyJobPosting[]; total: number; page: number; limit: number }> {
    const where: FindOptionsWhere<AgencyJobPosting> = {};

    if (filter.agency_id) where.agency_id = filter.agency_id;
    if (filter.job_type) where.job_type = filter.job_type;
    if (filter.location_province) where.location_province = filter.location_province;
    if (filter.is_remote !== undefined) where.is_remote = filter.is_remote;

    if (filter.status) {
      where.status = Array.isArray(filter.status) ? In(filter.status) : filter.status;
    }

    const [data, total] = await this.jobPostingRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async publishJobPosting(id: string): Promise<AgencyJobPosting> {
    const posting = await this.getJobPostingById(id);

    if (posting.status !== JobPostingStatus.DRAFT && posting.status !== JobPostingStatus.PAUSED) {
      throw new BadRequestException('Can only publish draft or paused job postings');
    }

    posting.status = JobPostingStatus.ACTIVE;
    posting.published_at = new Date();
    posting.is_visible = true;

    return this.jobPostingRepo.save(posting);
  }

  async pauseJobPosting(id: string): Promise<AgencyJobPosting> {
    const posting = await this.getJobPostingById(id);

    if (posting.status !== JobPostingStatus.ACTIVE) {
      throw new BadRequestException('Can only pause active job postings');
    }

    posting.status = JobPostingStatus.PAUSED;
    return this.jobPostingRepo.save(posting);
  }

  async closeJobPosting(id: string): Promise<AgencyJobPosting> {
    const posting = await this.getJobPostingById(id);

    posting.status = JobPostingStatus.CLOSED;
    posting.closed_at = new Date();

    return this.jobPostingRepo.save(posting);
  }

  async incrementViews(id: string): Promise<void> {
    await this.jobPostingRepo.increment({ id }, 'views_count', 1);
  }

  // ===========================================================================
  // Applications
  // ===========================================================================

  async submitApplication(dto: SubmitApplicationDto): Promise<AgencyJobApplication> {
    this.logger.log(`Caregiver ${dto.caregiver_id} applying to job ${dto.job_posting_id}`);

    const posting = await this.getJobPostingById(dto.job_posting_id);

    if (posting.status !== JobPostingStatus.ACTIVE) {
      throw new BadRequestException('Cannot apply to inactive job postings');
    }

    // Check for existing application
    const existing = await this.applicationRepo.findOne({
      where: {
        job_posting_id: dto.job_posting_id,
        caregiver_id: dto.caregiver_id,
      },
    });

    if (existing) {
      throw new BadRequestException('You have already applied to this job posting');
    }

    const application = this.applicationRepo.create({
      ...dto,
      status: ApplicationStatus.APPLIED,
      applied_at: new Date(),
    });

    const saved = await this.applicationRepo.save(application);

    // Increment application count
    await this.jobPostingRepo.increment({ id: dto.job_posting_id }, 'applications_count', 1);

    return saved;
  }

  async getApplicationById(id: string): Promise<AgencyJobApplication> {
    const application = await this.applicationRepo.findOne({
      where: { id },
      relations: ['job_posting'],
    });
    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    return application;
  }

  async listApplications(
    filter: { job_posting_id?: string; caregiver_id?: string; status?: ApplicationStatus },
    page = 1,
    limit = 20,
  ): Promise<{ data: AgencyJobApplication[]; total: number }> {
    const where: FindOptionsWhere<AgencyJobApplication> = {};

    if (filter.job_posting_id) where.job_posting_id = filter.job_posting_id;
    if (filter.caregiver_id) where.caregiver_id = filter.caregiver_id;
    if (filter.status) where.status = filter.status;

    const [data, total] = await this.applicationRepo.findAndCount({
      where,
      order: { applied_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['job_posting'],
    });

    return { data, total };
  }

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    userId: string,
    notes?: string,
    rejectionReason?: string,
  ): Promise<AgencyJobApplication> {
    const application = await this.getApplicationById(id);

    application.status = status;
    application.status_updated_at = new Date();

    // Set status-specific timestamps
    switch (status) {
      case ApplicationStatus.REVIEWED:
        application.reviewed_at = new Date();
        application.reviewed_by = userId;
        break;
      case ApplicationStatus.SHORTLISTED:
        application.shortlisted_at = new Date();
        break;
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        application.interview_scheduled_at = new Date();
        break;
      case ApplicationStatus.INTERVIEWED:
        application.interviewed_at = new Date();
        break;
      case ApplicationStatus.OFFERED:
        application.offered_at = new Date();
        break;
      case ApplicationStatus.HIRED:
        application.hired_at = new Date();
        // Increment positions filled
        await this.jobPostingRepo.increment(
          { id: application.job_posting_id },
          'positions_filled',
          1,
        );
        break;
      case ApplicationStatus.REJECTED:
        application.rejected_at = new Date();
        application.rejection_reason = rejectionReason;
        break;
      case ApplicationStatus.WITHDRAWN:
        application.withdrawn_at = new Date();
        break;
    }

    if (notes) {
      application.agency_notes = notes;
    }

    return this.applicationRepo.save(application);
  }

  async withdrawApplication(id: string, caregiverId: string): Promise<AgencyJobApplication> {
    const application = await this.getApplicationById(id);

    if (application.caregiver_id !== caregiverId) {
      throw new BadRequestException('You can only withdraw your own applications');
    }

    if ([ApplicationStatus.HIRED, ApplicationStatus.WITHDRAWN].includes(application.status)) {
      throw new BadRequestException('Cannot withdraw this application');
    }

    return this.updateApplicationStatus(id, ApplicationStatus.WITHDRAWN, caregiverId);
  }

  async setMatchScore(
    id: string,
    matchScore: number,
    matchFactors: AgencyJobApplication['match_factors'],
  ): Promise<AgencyJobApplication> {
    const application = await this.getApplicationById(id);

    application.match_score = matchScore;
    application.match_factors = matchFactors;

    return this.applicationRepo.save(application);
  }
}

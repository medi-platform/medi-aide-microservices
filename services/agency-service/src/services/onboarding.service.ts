import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyProfile } from '../entities/agency-profile.entity';
import { AgencyRegistrationProgress } from '../entities/agency-registration-progress.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(AgencyProfile)
    private agencyRepo: Repository<AgencyProfile>,
    @InjectRepository(AgencyRegistrationProgress)
    private progressRepo: Repository<AgencyRegistrationProgress>,
  ) {}

  async start(dto: any) {
    const agency = this.agencyRepo.create({
      ...dto,
      onboarding_status: 'in_progress',
      onboarding_started_at: new Date(),
    } as Partial<AgencyProfile>);
    const result = await this.agencyRepo.save(agency);
    const savedAgency = Array.isArray(result) ? result[0] : result;

    const progress = this.progressRepo.create({
      agency_id: savedAgency.id,
      steps: {
        basic_info: { completed: false },
        documents: { completed: false },
        compliance: { completed: false },
        team_setup: { completed: false },
        payment: { completed: false },
      },
    });
    await this.progressRepo.save(progress);

    return { agency: savedAgency, progress };
  }

  async getProgress(agencyId: string) {
    const progress = await this.progressRepo.findOne({
      where: { agency_id: agencyId },
    });
    if (!progress) throw new NotFoundException('Progress not found');
    return progress;
  }

  async completeStep(agencyId: string, step: string, dto: any) {
    const progress = await this.getProgress(agencyId);
    progress.steps[step] = { completed: true, data: dto, completedAt: new Date() };
    await this.progressRepo.update(progress.id, { steps: progress.steps });
    return this.getProgress(agencyId);
  }

  async uploadDocument(agencyId: string, dto: any) {
    return { ...dto, uploaded: true };
  }

  async getDocuments(agencyId: string) {
    return [];
  }

  async submitForReview(agencyId: string) {
    await this.agencyRepo.update(agencyId, {
      onboarding_status: 'pending_review' as any,
      profile_submitted_at: new Date(),
    });
    return { status: 'submitted_for_review' };
  }

  async approve(agencyId: string, dto: any) {
    await this.agencyRepo.update(agencyId, {
      onboarding_status: 'approved' as any,
      is_approved: true,
      is_active: true,
      activated_at: new Date(),
    });
    return { status: 'approved' };
  }

  async reject(agencyId: string, reason: string) {
    await this.agencyRepo.update(agencyId, {
      onboarding_status: 'rejected' as any,
    });
    return { status: 'rejected', reason };
  }

  async getPendingOnboarding() {
    return this.agencyRepo.find({
      where: { onboarding_status: 'pending_review' as any },
    });
  }
}



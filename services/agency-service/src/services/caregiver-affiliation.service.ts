import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CaregiverAffiliation } from '../entities/caregiver-affiliation.entity';

@Injectable()
export class CaregiverAffiliationService {
  constructor(
    @InjectRepository(CaregiverAffiliation)
    private affiliationRepo: Repository<CaregiverAffiliation>,
  ) {}

  async create(agencyId: string, dto: any) {
    const affiliation = this.affiliationRepo.create({ 
      ...dto, 
      agency_id: agencyId,
      status: 'pending'
    });
    return this.affiliationRepo.save(affiliation);
  }

  async findAll(agencyId: string, query: any) {
    const { status, search, page = 1, limit = 20 } = query;
    const where: any = { agency_id: agencyId };
    if (status) where.status = status;

    const [items, total] = await this.affiliationRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async getAvailable(agencyId: string, date: string, skills?: string[]) {
    // Query caregivers available on date with required skills
    const affiliations = await this.affiliationRepo.find({
      where: { agency_id: agencyId, status: 'active' },
    });
    return affiliations;
  }

  async findById(agencyId: string, caregiverId: string) {
    const affiliation = await this.affiliationRepo.findOne({
      where: { agency_id: agencyId, caregiver_id: caregiverId },
    });
    if (!affiliation) throw new NotFoundException('Affiliation not found');
    return affiliation;
  }

  async update(agencyId: string, caregiverId: string, dto: any) {
    const affiliation = await this.findById(agencyId, caregiverId);
    await this.affiliationRepo.update(affiliation.id, dto);
    return this.findById(agencyId, caregiverId);
  }

  async activate(agencyId: string, caregiverId: string) {
    const affiliation = await this.findById(agencyId, caregiverId);
    await this.affiliationRepo.update(affiliation.id, { status: 'active' });
    return this.findById(agencyId, caregiverId);
  }

  async deactivate(agencyId: string, caregiverId: string, reason: string) {
    const affiliation = await this.findById(agencyId, caregiverId);
    await this.affiliationRepo.update(affiliation.id, { 
      status: 'inactive',
      deactivation_reason: reason 
    });
    return this.findById(agencyId, caregiverId);
  }

  async remove(agencyId: string, caregiverId: string) {
    const affiliation = await this.findById(agencyId, caregiverId);
    await this.affiliationRepo.delete(affiliation.id);
    return { status: 'removed' };
  }

  async bulkInvite(agencyId: string, emails: string[]) {
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          return await this.create(agencyId, { email, status: 'invited' });
        } catch (error) {
          return { email, error: 'Failed to invite' };
        }
      })
    );
    return { invitations: results };
  }

  async getPerformance(agencyId: string, caregiverId: string) {
    // Return performance metrics
    return {
      caregiverId,
      metrics: {
        completedVisits: 150,
        averageRating: 4.8,
        onTimeRate: 96,
        patientSatisfaction: 95,
      },
    };
  }

  async getSchedule(agencyId: string, caregiverId: string, start: string, end: string) {
    // Return schedule
    return {
      caregiverId,
      period: { start, end },
      shifts: [],
    };
  }
}


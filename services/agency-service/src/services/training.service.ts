import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyTrainingRequirement } from '../entities/agency-training-requirement.entity';
import { AgencyTrainingAssignment } from '../entities/agency-training-assignment.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(AgencyTrainingRequirement)
    private requirementRepo: Repository<AgencyTrainingRequirement>,
    @InjectRepository(AgencyTrainingAssignment)
    private assignmentRepo: Repository<AgencyTrainingAssignment>,
  ) {}

  async getRequirements(agencyId: string) {
    return this.requirementRepo.find({ where: { agency_id: agencyId } });
  }

  async createRequirement(agencyId: string, dto: any) {
    const req = this.requirementRepo.create({ ...dto, agency_id: agencyId });
    return this.requirementRepo.save(req);
  }

  async updateRequirement(agencyId: string, requirementId: string, dto: any) {
    await this.requirementRepo.update(requirementId, dto);
    return this.requirementRepo.findOne({ where: { id: requirementId } });
  }

  async deleteRequirement(agencyId: string, requirementId: string) {
    await this.requirementRepo.delete(requirementId);
    return { deleted: true };
  }

  async getAssignments(agencyId: string, query: any) {
    const { caregiverId, status, page = 1, limit = 20 } = query;
    const where: any = { agency_id: agencyId };
    if (caregiverId) where.caregiver_id = caregiverId;
    if (status) where.status = status;

    const [items, total] = await this.assignmentRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, total, page, limit };
  }

  async assignTraining(agencyId: string, dto: any) {
    const assignment = this.assignmentRepo.create({ 
      ...dto, 
      agency_id: agencyId,
      status: 'assigned' 
    });
    return this.assignmentRepo.save(assignment);
  }

  async completeAssignment(agencyId: string, assignmentId: string, dto: any) {
    await this.assignmentRepo.update(assignmentId, {
      status: 'completed',
      completed_at: new Date(),
      ...dto,
    });
    return this.assignmentRepo.findOne({ where: { id: assignmentId } });
  }

  async getComplianceReport(agencyId: string) {
    return {
      totalCaregivers: 50,
      compliant: 45,
      nonCompliant: 5,
      complianceRate: 90,
    };
  }

  async getExpiring(agencyId: string, days: number) {
    return [];
  }

  async getCosts(agencyId: string, period: string) {
    return {
      period,
      totalCost: 5000,
      breakdown: [],
    };
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsurancePolicy } from '../entities/insurance-policy.entity';

@Injectable()
export class InsuranceService {
  constructor(@InjectRepository(InsurancePolicy) private repo: Repository<InsurancePolicy>) {}

  async findAll(query: any) { const [items, total] = await this.repo.findAndCount(); return { items, total }; }
  async create(dto: any) { return this.repo.save(this.repo.create(dto)); }
  async findById(id: string) { const p = await this.repo.findOne({ where: { id } }); if (!p) throw new NotFoundException(); return p; }
  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
  async verify(dto: any) { return { verified: true, policyNumber: dto.policyNumber, status: 'active' }; }
  async getPatientInsurance(patientId: string) { return this.repo.find({ where: { patient_id: patientId } }); }
  async checkEligibility(policyId: string) { return { policyId, eligible: true, coverage: { homecare: true, respite: true } }; }
}



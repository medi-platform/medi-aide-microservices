import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from '../entities/medical-record.entity';

@Injectable()
export class MedicalService {
  constructor(@InjectRepository(MedicalRecord) private repo: Repository<MedicalRecord>) {}

  async findAll(patientId: string) { return this.repo.find({ where: { patient_id: patientId }, order: { created_at: 'DESC' } }); }
  async create(patientId: string, dto: any) { return this.repo.save(this.repo.create({ ...dto, patient_id: patientId })); }
  async getConditions(patientId: string) { return { patientId, conditions: [] }; }
  async getVitals(patientId: string) { return { patientId, vitals: [] }; }
  async recordVitals(patientId: string, dto: any) { return { patientId, ...dto, recorded: true }; }
}



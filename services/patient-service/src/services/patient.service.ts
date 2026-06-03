import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientService {
  constructor(@InjectRepository(Patient) private repo: Repository<Patient>) {}

  async create(dto: any) { return this.repo.save(this.repo.create(dto)); }

  async findAll(query: any) {
    const { page = 1, limit = 20 } = query;
    const [items, total] = await this.repo.findAndCount({ take: limit, skip: (page - 1) * limit, order: { created_at: 'DESC' } });
    return { items, total, page, limit };
  }

  async search(q: string) { return this.repo.find({ where: [{ first_name: ILike(`%${q}%`) }, { last_name: ILike(`%${q}%`) }], take: 50 }); }

  async findById(id: string) {
    const patient = await this.repo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, dto: any) { await this.repo.update(id, dto); return this.findById(id); }
  async remove(id: string) { await this.repo.update(id, { is_active: false }); return { status: 'removed' }; }
  async getCareHistory(id: string) { return { patientId: id, history: [] }; }
  async getMedications(id: string) { return { patientId: id, medications: [] }; }
  async getAllergies(id: string) { return { patientId: id, allergies: [] }; }
  async getPreferences(id: string) { return { patientId: id, preferences: {} }; }
  async updatePreferences(id: string, dto: any) { return { patientId: id, preferences: dto }; }
}



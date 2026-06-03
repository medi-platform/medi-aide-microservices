import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from '../entities/family-member.entity';
import { EmergencyContact } from '../entities/emergency-contact.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(FamilyMember) private familyRepo: Repository<FamilyMember>,
    @InjectRepository(EmergencyContact) private emergencyRepo: Repository<EmergencyContact>
  ) {}

  async findAll(patientId: string) { return this.familyRepo.find({ where: { patient_id: patientId } }); }
  async create(patientId: string, dto: any) { return this.familyRepo.save(this.familyRepo.create({ ...dto, patient_id: patientId })); }
  async update(patientId: string, memberId: string, dto: any) { await this.familyRepo.update(memberId, dto); return this.familyRepo.findOne({ where: { id: memberId } }); }
  async remove(patientId: string, memberId: string) { await this.familyRepo.delete(memberId); return { status: 'removed' }; }
  async getEmergencyContacts(patientId: string) { return this.emergencyRepo.find({ where: { patient_id: patientId } }); }
}



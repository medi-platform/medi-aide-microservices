import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { CaregiverProfile } from '../entities/caregiver-profile.entity';
import { CaregiverSkill } from '../entities/caregiver-skill.entity';

@Injectable()
export class CaregiverService {
  constructor(
    @InjectRepository(CaregiverProfile)
    private caregiverRepo: Repository<CaregiverProfile>,
    @InjectRepository(CaregiverSkill)
    private skillRepo: Repository<CaregiverSkill>,
  ) {}

  async create(dto: any) {
    const caregiver = this.caregiverRepo.create(dto);
    return this.caregiverRepo.save(caregiver);
  }

  async findAll(query: any) {
    const { status, skills, city, experience, page = 1, limit = 20 } = query;
    const where: any = {};

    if (status) where.is_active = status === 'active';
    if (city) where.city = ILike(`%${city}%`);
    if (experience) where.experience = experience;

    const [items, total] = await this.caregiverRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async search(q: string, skills?: string[], location?: string) {
    const query = this.caregiverRepo.createQueryBuilder('c');
    
    if (q) {
      query.where('c.bio ILIKE :q', { q: `%${q}%` });
    }
    
    if (location) {
      query.andWhere('(c.city ILIKE :loc OR c.postal_code ILIKE :loc)', { loc: `%${location}%` });
    }

    return query.take(50).getMany();
  }

  async getAvailable(date: string, startTime: string, endTime: string, skills?: string[]) {
    // In production, join with availability table
    return this.caregiverRepo.find({
      where: { is_active: true, is_approved: true },
      take: 50,
    });
  }

  async findById(id: string) {
    const caregiver = await this.caregiverRepo.findOne({ where: { id } });
    if (!caregiver) throw new NotFoundException('Caregiver not found');
    return caregiver;
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    await this.caregiverRepo.update(id, dto);
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await this.caregiverRepo.update(id, { is_active: status === 'active' });
    return this.findById(id);
  }

  async approve(id: string) {
    await this.caregiverRepo.update(id, { is_approved: true });
    return this.findById(id);
  }

  async remove(id: string) {
    await this.caregiverRepo.update(id, { is_active: false });
    return { id, status: 'deactivated' };
  }

  async getSummary(id: string) {
    const caregiver = await this.findById(id);
    return {
      caregiver,
      stats: {
        totalVisits: 150,
        completedVisits: 145,
        avgRating: 4.8,
        hoursWorked: 1200,
      },
    };
  }

  async getSkills(id: string) {
    return this.skillRepo.find({ where: { caregiver_id: id } });
  }

  async updateSkills(id: string, skills: string[]) {
    // Update skills
    await this.skillRepo.delete({ caregiver_id: id });
    const skillEntities = skills.map(s => this.skillRepo.create({ caregiver_id: id, skill: s }));
    await this.skillRepo.save(skillEntities);
    return this.getSkills(id);
  }

  async getPatients(id: string) {
    return [];
  }

  async getVisits(id: string, startDate: string, endDate: string) {
    return {
      caregiverId: id,
      period: { startDate, endDate },
      visits: [],
    };
  }
}


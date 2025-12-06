import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarePlan } from '../entities/care-plan.entity';

@Injectable()
export class CarePlanService {
  constructor(
    @InjectRepository(CarePlan) 
    private readonly repo: Repository<CarePlan>
  ) {}

  async list() {
    return this.repo.find({ 
      take: 50,
      order: { createdAt: 'DESC' }
    });
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: any) {
    const plan = this.repo.create({
      ...data,
      status: data.status || 'draft'
    });
    return this.repo.save(plan);
  }

  async update(id: string, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}

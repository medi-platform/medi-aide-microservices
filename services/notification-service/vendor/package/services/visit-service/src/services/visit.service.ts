import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from '../entities/visit.entity';

@Injectable()
export class VisitService {
  constructor(
    @InjectRepository(Visit) private readonly repo: Repository<Visit>
  ) {}

  async list() {
    return this.repo.find({ take: 20, order: { scheduledStart: 'DESC' } });
  }
}

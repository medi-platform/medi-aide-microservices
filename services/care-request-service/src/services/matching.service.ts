import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareRequestMatch } from '../entities/care-request-match.entity';

@Injectable()
export class MatchingService {
  constructor(@InjectRepository(CareRequestMatch) private repo: Repository<CareRequestMatch>) {}

  async getCandidates(requestId: string) { return this.repo.find({ where: { care_request_id: requestId }, order: { score: 'DESC' } }); }
  async runMatching(requestId: string) { return { requestId, status: 'matching_started', candidates: [] }; }
  async getScores(requestId: string) { return this.repo.find({ where: { care_request_id: requestId } }); }
  async selectMatch(requestId: string, caregiverId: string) { return { requestId, caregiverId, selected: true }; }
}



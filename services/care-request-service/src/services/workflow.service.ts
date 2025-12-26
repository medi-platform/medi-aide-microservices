import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowService {
  async getStatus(requestId: string) { return { requestId, currentStep: 'pending_match', steps: ['pending_match', 'matched', 'confirmed', 'active', 'completed'] }; }
  async advance(requestId: string) { return { requestId, advanced: true }; }
  async approve(requestId: string, dto: any) { return { requestId, approved: true, ...dto }; }
  async reject(requestId: string, reason: string) { return { requestId, rejected: true, reason }; }
}



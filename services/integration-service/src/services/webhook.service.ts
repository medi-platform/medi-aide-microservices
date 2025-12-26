import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from '../entities/webhook-event.entity';

@Injectable()
export class WebhookService {
  constructor(@InjectRepository(WebhookEvent) private repo: Repository<WebhookEvent>) {}

  async receive(provider: string, payload: any, headers: any) { return this.repo.save(this.repo.create({ provider, payload, status: 'received' })); }
  async getEvents(query: any) { return this.repo.find({ order: { created_at: 'DESC' }, take: 50 }); }
  async verify(provider: string, dto: any) { return { provider, verified: true }; }
}


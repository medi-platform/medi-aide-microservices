import { Injectable } from '@nestjs/common';
// Dev-time in-memory service; replace with TypeORM repository in production

@Injectable()
export class VisitService {
  private readonly visits: any[] = [];

  async list() {
    return this.visits.slice(-20).reverse();
  }
}

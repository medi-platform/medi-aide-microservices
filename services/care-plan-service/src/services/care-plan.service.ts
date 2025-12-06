import { Injectable } from '@nestjs/common';
// Minimal in-memory service for dev-time availability; replace with TypeORM in prod

@Injectable()
export class CarePlanService {
  private readonly plans: any[] = [];

  async list() {
    return this.plans.slice(-50).reverse();
  }

  async findById(id: string) {
    return this.plans.find((p) => p.id === id) || null;
  }

  async create(data: any) {
    const plan = { id: crypto.randomUUID(), ...data, status: data.status || 'draft', createdAt: new Date() };
    this.plans.push(plan);
    return plan;
  }

  async update(id: string, data: any) {
    const idx = this.plans.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.plans[idx] = { ...this.plans[idx], ...data };
      return this.plans[idx];
    }
    return null;
  }
}

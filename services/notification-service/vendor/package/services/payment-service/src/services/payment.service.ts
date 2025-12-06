import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) 
    private readonly repo: Repository<Payment>
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

  async processPayment(data: any): Promise<Payment> {
    // Mock payment processing
    const payment = this.repo.create({
      ...data,
      status: 'processing' as const,
      metadata: {
        processor: 'stripe',
        requestId: Math.random().toString(36).substring(7)
      }
    });

    const saved = await this.repo.save(payment);
    
    // Ensure we have a single payment entity
    const savedPayment = Array.isArray(saved) ? saved[0] : saved;
    
    if (!savedPayment) {
      throw new NotFoundException('Failed to create payment');
    }

    // Simulate async processing (simplified - in production use queues)
    const paymentId = savedPayment.id;
    setTimeout(async () => {
      try {
        const toUpdate = await this.repo.findOne({ where: { id: paymentId } });
        if (toUpdate) {
          toUpdate.status = 'completed';
          toUpdate.metadata = {
            ...toUpdate.metadata,
            completedAt: new Date().toISOString()
          };
          await this.repo.save(toUpdate);
        }
      } catch (error) {
        console.error('Failed to update payment status:', error);
      }
    }, 2000);

    return savedPayment;
  }
}

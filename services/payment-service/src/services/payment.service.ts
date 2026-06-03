import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../entities/payment.entity';
import { Refund } from '../entities/refund.entity';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  PaymentIntent,
  RefundReason,
  RefundResult,
} from '../interfaces/payment.interface';

/**
 * Payment Service
 * Core payment processing logic
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly platformFeePercent: number;
  private readonly processingFeePercent: number;
  private readonly fixedFee: number;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    private readonly configService: ConfigService,
  ) {
    this.platformFeePercent = this.configService.get<number>('fees.platformFeePercent', 2.5);
    this.processingFeePercent = this.configService.get<number>('fees.processingFeePercent', 2.9);
    this.fixedFee = this.configService.get<number>('fees.fixedFee', 0.30);
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: number,
    payerId: string,
    payerType: 'patient' | 'family' | 'agency' | 'insurance',
    paymentMethod: PaymentMethod,
    paymentType: PaymentType,
    visitId?: string,
    invoiceId?: string,
    payeeId?: string,
    payeeType?: 'caregiver' | 'agency',
    description?: string,
    metadata?: Record<string, unknown>,
  ): Promise<PaymentIntent> {
    // Calculate fees
    const platformFee = (amount * this.platformFeePercent) / 100;
    const processingFee = (amount * this.processingFeePercent) / 100 + this.fixedFee;
    const netAmount = amount - platformFee - processingFee;

    const payment = this.paymentRepo.create({
      amount,
      currency: 'CAD',
      payerId,
      payerType,
      payeeId,
      payeeType,
      paymentMethod,
      paymentType,
      visitId,
      invoiceId,
      description,
      platformFee,
      processingFee,
      netAmount,
      metadata,
      status: PaymentStatus.PENDING,
    });

    const saved = await this.paymentRepo.save(payment);

    // In production, integrate with Stripe:
    // const stripePaymentIntent = await this.stripe.paymentIntents.create({...});

    this.logger.log(`Payment intent ${saved.id} created for ${amount} CAD`);

    return {
      id: saved.id,
      amount: saved.amount,
      currency: saved.currency,
      status: saved.status,
      clientSecret: `pi_${saved.id}_secret`, // Mock client secret
      metadata: saved.metadata,
    };
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(paymentId: string, paymentMethodId?: string): Promise<Payment> {
    const payment = await this.getById(paymentId);

    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.REQUIRES_ACTION) {
      throw new BadRequestException(`Payment cannot be confirmed in status ${payment.status}`);
    }

    // In production, confirm with Stripe
    payment.status = PaymentStatus.SUCCEEDED;
    payment.processedAt = new Date();
    if (paymentMethodId) {
      payment.externalPaymentMethodId = paymentMethodId;
    }

    const saved = await this.paymentRepo.save(payment);
    this.logger.log(`Payment ${paymentId} confirmed`);

    return saved;
  }

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  /**
   * Get payments by payer
   */
  async getByPayer(payerId: string, status?: PaymentStatus): Promise<Payment[]> {
    const where: Record<string, unknown> = { payerId };
    if (status) where.status = status;

    return this.paymentRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get payments by visit
   */
  async getByVisit(visitId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { visitId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Process refund
   */
  async refund(
    paymentId: string,
    amount: number,
    reason: RefundReason,
    initiatedBy: string,
    notes?: string,
  ): Promise<RefundResult> {
    const payment = await this.getById(paymentId);

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Can only refund successful payments');
    }

    const maxRefundable = payment.amount - payment.refundedAmount;
    if (amount > maxRefundable) {
      throw new BadRequestException(`Maximum refundable amount is ${maxRefundable}`);
    }

    const refund = this.refundRepo.create({
      paymentId,
      amount,
      currency: payment.currency,
      reason,
      initiatedBy,
      notes,
      status: 'pending',
    });

    const savedRefund = await this.refundRepo.save(refund);

    // In production, process with Stripe
    savedRefund.status = 'succeeded';
    savedRefund.processedAt = new Date();
    await this.refundRepo.save(savedRefund);

    // Update payment
    payment.refundedAmount += amount;
    if (payment.refundedAmount >= payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }
    await this.paymentRepo.save(payment);

    this.logger.log(`Refund ${savedRefund.id} processed for ${amount} CAD`);

    return {
      id: savedRefund.id,
      amount: savedRefund.amount,
      status: savedRefund.status,
      reason: savedRefund.reason,
    };
  }

  /**
   * Cancel a payment
   */
  async cancel(paymentId: string): Promise<Payment> {
    const payment = await this.getById(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending payments');
    }

    payment.status = PaymentStatus.CANCELLED;
    return this.paymentRepo.save(payment);
  }
}

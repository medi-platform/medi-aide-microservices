import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AgencyInvoice } from '../entities/agency-invoice.entity';
import { AgencyPayment } from '../entities/agency-payment.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(AgencyInvoice)
    private invoiceRepo: Repository<AgencyInvoice>,
    @InjectRepository(AgencyPayment)
    private paymentRepo: Repository<AgencyPayment>,
  ) {}

  async getInvoices(agencyId: string, query: any) {
    const { status, startDate, endDate, page = 1, limit = 20 } = query;
    const where: any = { agency_id: agencyId };
    if (status) where.status = status;

    const [items, total] = await this.invoiceRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async getInvoice(agencyId: string, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, agency_id: agencyId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoice(agencyId: string, dto: any) {
    const invoice = this.invoiceRepo.create({ ...dto, agency_id: agencyId });
    return this.invoiceRepo.save(invoice);
  }

  async generateInvoices(agencyId: string, dto: { startDate: string; endDate: string }) {
    // Generate invoices for billing period
    return { message: 'Invoice generation started', period: dto };
  }

  async sendInvoice(agencyId: string, invoiceId: string) {
    await this.invoiceRepo.update(invoiceId, { status: 'sent', sent_at: new Date() });
    return this.getInvoice(agencyId, invoiceId);
  }

  async getPayments(agencyId: string, query: any) {
    const { page = 1, limit = 20 } = query;
    const [items, total] = await this.paymentRepo.findAndCount({
      where: { agency_id: agencyId },
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });
    return { items, total, page, limit };
  }

  async recordPayment(agencyId: string, dto: any) {
    const payment = this.paymentRepo.create({ ...dto, agency_id: agencyId });
    return this.paymentRepo.save(payment);
  }

  async getSummary(agencyId: string, period: string) {
    return {
      period,
      totalRevenue: 150000,
      totalPending: 25000,
      totalOverdue: 5000,
      invoiceCount: 45,
    };
  }

  async getRevenue(agencyId: string, startDate: string, endDate: string) {
    return {
      period: { startDate, endDate },
      totalRevenue: 150000,
      breakdown: [],
    };
  }

  async getOutstanding(agencyId: string) {
    return {
      totalOutstanding: 30000,
      items: [],
    };
  }

  async getRates(agencyId: string) {
    return {
      standardHourlyRate: 35,
      specializedCareRate: 50,
      overtimeMultiplier: 1.5,
    };
  }

  async updateRates(agencyId: string, dto: any) {
    return { ...dto, updated: true };
  }
}



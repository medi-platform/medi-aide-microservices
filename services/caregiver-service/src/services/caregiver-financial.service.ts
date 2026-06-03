import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CaregiverInvoice } from '../entities/caregiver-invoice.entity';
import { CaregiverExpense, ExpenseStatus } from '../entities/caregiver-expense.entity';
import { CaregiverPayPeriod } from '../entities/caregiver-pay-period.entity';
import { CaregiverBonus, BonusStatus } from '../entities/caregiver-bonus.entity';
import { CaregiverPenalty, PenaltyStatus } from '../entities/caregiver-penalty.entity';
import { CaregiverBankAccount, AccountVerificationStatus } from '../entities/caregiver-bank-account.entity';
import { CaregiverTaxInfo } from '../entities/caregiver-tax-info.entity';

@Injectable()
export class CaregiverFinancialService {
  constructor(
    @InjectRepository(CaregiverInvoice)
    private readonly invoiceRepository: Repository<CaregiverInvoice>,
    @InjectRepository(CaregiverExpense)
    private readonly expenseRepository: Repository<CaregiverExpense>,
    @InjectRepository(CaregiverPayPeriod)
    private readonly payPeriodRepository: Repository<CaregiverPayPeriod>,
    @InjectRepository(CaregiverBonus)
    private readonly bonusRepository: Repository<CaregiverBonus>,
    @InjectRepository(CaregiverPenalty)
    private readonly penaltyRepository: Repository<CaregiverPenalty>,
    @InjectRepository(CaregiverBankAccount)
    private readonly bankAccountRepository: Repository<CaregiverBankAccount>,
    @InjectRepository(CaregiverTaxInfo)
    private readonly taxInfoRepository: Repository<CaregiverTaxInfo>,
  ) {}

  // ===== INVOICES =====

  async createInvoice(data: Partial<CaregiverInvoice>): Promise<CaregiverInvoice> {
    const invoice = this.invoiceRepository.create(data);
    return this.invoiceRepository.save(invoice);
  }

  async getInvoice(id: string): Promise<CaregiverInvoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async listCaregiverInvoices(caregiverId: string): Promise<CaregiverInvoice[]> {
    return this.invoiceRepository.find({
      where: { caregiver_id: caregiverId },
      order: { invoice_date: 'DESC' },
    });
  }

  // ===== EXPENSES =====

  async submitExpense(data: Partial<CaregiverExpense>): Promise<CaregiverExpense> {
    const expense = this.expenseRepository.create({
      ...data,
      status: ExpenseStatus.PENDING,
    });
    return this.expenseRepository.save(expense);
  }

  async getExpense(id: string): Promise<CaregiverExpense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    return expense;
  }

  async approveExpense(id: string, approvedById: string): Promise<CaregiverExpense> {
    const expense = await this.getExpense(id);
    expense.status = ExpenseStatus.APPROVED;
    expense.approved_by = approvedById;
    expense.approved_at = new Date();
    return this.expenseRepository.save(expense);
  }

  async rejectExpense(id: string, reason: string): Promise<CaregiverExpense> {
    const expense = await this.getExpense(id);
    expense.status = ExpenseStatus.REJECTED;
    expense.rejection_reason = reason;
    expense.metadata = { ...expense.metadata, rejectionReason: reason };
    return this.expenseRepository.save(expense);
  }

  async listCaregiverExpenses(
    caregiverId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CaregiverExpense[]> {
    const where: any = { caregiver_id: caregiverId };
    if (startDate && endDate) {
      where.expense_date = Between(startDate, endDate);
    }
    return this.expenseRepository.find({
      where,
      order: { expense_date: 'DESC' },
    });
  }

  // ===== PAY PERIODS =====

  async createPayPeriod(data: Partial<CaregiverPayPeriod>): Promise<CaregiverPayPeriod> {
    const payPeriod = this.payPeriodRepository.create(data);
    return this.payPeriodRepository.save(payPeriod);
  }

  async getPayPeriod(id: string): Promise<CaregiverPayPeriod> {
    const payPeriod = await this.payPeriodRepository.findOne({ where: { id } });
    if (!payPeriod) {
      throw new NotFoundException(`Pay period ${id} not found`);
    }
    return payPeriod;
  }

  async listCaregiverPayPeriods(caregiverId: string): Promise<CaregiverPayPeriod[]> {
    return this.payPeriodRepository.find({
      where: { caregiver_id: caregiverId },
      order: { period_start: 'DESC' },
    });
  }

  // ===== BONUSES =====

  async awardBonus(data: Partial<CaregiverBonus>): Promise<CaregiverBonus> {
    const bonus = this.bonusRepository.create(data);
    return this.bonusRepository.save(bonus);
  }

  async getBonus(id: string): Promise<CaregiverBonus> {
    const bonus = await this.bonusRepository.findOne({ where: { id } });
    if (!bonus) {
      throw new NotFoundException(`Bonus ${id} not found`);
    }
    return bonus;
  }

  async approveBonus(id: string, approvedBy: string): Promise<CaregiverBonus> {
    const bonus = await this.getBonus(id);
    bonus.status = BonusStatus.APPROVED;
    bonus.approvedBy = approvedBy;
    bonus.approvedAt = new Date();
    return this.bonusRepository.save(bonus);
  }

  async listCaregiverBonuses(caregiverId: string): Promise<CaregiverBonus[]> {
    return this.bonusRepository.find({
      where: { caregiverId },
      order: { bonusDate: 'DESC' },
    });
  }

  // ===== PENALTIES =====

  async issuePenalty(data: Partial<CaregiverPenalty>): Promise<CaregiverPenalty> {
    const penalty = this.penaltyRepository.create(data);
    return this.penaltyRepository.save(penalty);
  }

  async getPenalty(id: string): Promise<CaregiverPenalty> {
    const penalty = await this.penaltyRepository.findOne({ where: { id } });
    if (!penalty) {
      throw new NotFoundException(`Penalty ${id} not found`);
    }
    return penalty;
  }

  async appealPenalty(id: string, reason: string): Promise<CaregiverPenalty> {
    const penalty = await this.getPenalty(id);
    penalty.status = PenaltyStatus.APPEALED;
    penalty.appealReason = reason;
    penalty.appealedAt = new Date();
    return this.penaltyRepository.save(penalty);
  }

  async resolvePenaltyAppeal(
    id: string,
    reviewedBy: string,
    decision: string,
    waive: boolean,
  ): Promise<CaregiverPenalty> {
    const penalty = await this.getPenalty(id);
    penalty.appealReviewedBy = reviewedBy;
    penalty.appealDecision = decision;
    penalty.appealDecidedAt = new Date();
    penalty.status = waive ? PenaltyStatus.WAIVED : PenaltyStatus.APPLIED;
    if (waive) {
      penalty.waivedBy = reviewedBy;
      penalty.waiverReason = decision;
    }
    return this.penaltyRepository.save(penalty);
  }

  async listCaregiverPenalties(caregiverId: string): Promise<CaregiverPenalty[]> {
    return this.penaltyRepository.find({
      where: { caregiverId },
      order: { penaltyDate: 'DESC' },
    });
  }

  // ===== BANK ACCOUNTS =====

  async addBankAccount(data: Partial<CaregiverBankAccount>): Promise<CaregiverBankAccount> {
    // If setting as primary, unset others
    if (data.isPrimary) {
      await this.bankAccountRepository.update(
        { caregiverId: data.caregiverId, isPrimary: true },
        { isPrimary: false },
      );
    }
    const account = this.bankAccountRepository.create(data);
    return this.bankAccountRepository.save(account);
  }

  async getBankAccount(id: string): Promise<CaregiverBankAccount> {
    const account = await this.bankAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }
    return account;
  }

  async verifyBankAccount(id: string): Promise<CaregiverBankAccount> {
    const account = await this.getBankAccount(id);
    account.verificationStatus = AccountVerificationStatus.VERIFIED;
    account.verifiedAt = new Date();
    return this.bankAccountRepository.save(account);
  }

  async listCaregiverBankAccounts(caregiverId: string): Promise<CaregiverBankAccount[]> {
    return this.bankAccountRepository.find({
      where: { caregiverId, isActive: true },
    });
  }

  // ===== TAX INFO =====

  async saveTaxInfo(data: Partial<CaregiverTaxInfo>): Promise<CaregiverTaxInfo> {
    // Mark existing as not current
    if (data.isCurrent) {
      await this.taxInfoRepository.update(
        { caregiverId: data.caregiverId, isCurrent: true },
        { isCurrent: false },
      );
    }
    const taxInfo = this.taxInfoRepository.create(data);
    return this.taxInfoRepository.save(taxInfo);
  }

  async getCurrentTaxInfo(caregiverId: string): Promise<CaregiverTaxInfo | null> {
    return this.taxInfoRepository.findOne({
      where: { caregiverId, isCurrent: true },
    });
  }

  async listTaxInfoHistory(caregiverId: string): Promise<CaregiverTaxInfo[]> {
    return this.taxInfoRepository.find({
      where: { caregiverId },
      order: { taxYear: 'DESC' },
    });
  }
}

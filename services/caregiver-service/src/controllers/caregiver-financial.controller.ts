import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CaregiverFinancialService } from '../services/caregiver-financial.service';

@ApiTags('Caregiver Financial')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverFinancialController {
  constructor(private readonly financialService: CaregiverFinancialService) {}

  // ===== INVOICES =====

  @Post(':caregiverId/invoices')
  @ApiOperation({ summary: 'Create an invoice for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async createInvoice(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.financialService.createInvoice({ ...data, caregiverId });
  }

  @Get(':caregiverId/invoices')
  @ApiOperation({ summary: 'List invoices for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async listInvoices(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.listCaregiverInvoices(caregiverId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  async getInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.getInvoice(id);
  }

  // ===== EXPENSES =====

  @Post(':caregiverId/expenses')
  @ApiOperation({ summary: 'Submit an expense claim' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Expense submitted' })
  async submitExpense(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.financialService.submitExpense({ ...data, caregiverId });
  }

  @Get(':caregiverId/expenses')
  @ApiOperation({ summary: 'List expenses for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of expenses' })
  async listExpenses(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.listCaregiverExpenses(
      caregiverId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get expense details' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense details' })
  async getExpense(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.getExpense(id);
  }

  @Post('expenses/:id/approve')
  @ApiOperation({ summary: 'Approve an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense approved' })
  async approveExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { approvedById: string },
  ) {
    return this.financialService.approveExpense(id, body.approvedById);
  }

  @Post('expenses/:id/reject')
  @ApiOperation({ summary: 'Reject an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense rejected' })
  async rejectExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ) {
    return this.financialService.rejectExpense(id, body.reason);
  }

  // ===== PAY PERIODS =====

  @Get(':caregiverId/pay-periods')
  @ApiOperation({ summary: 'List pay periods for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of pay periods' })
  async listPayPeriods(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.listCaregiverPayPeriods(caregiverId);
  }

  @Get('pay-periods/:id')
  @ApiOperation({ summary: 'Get pay period details' })
  @ApiParam({ name: 'id', description: 'Pay period UUID' })
  @ApiResponse({ status: 200, description: 'Pay period details' })
  async getPayPeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.getPayPeriod(id);
  }

  // ===== BONUSES =====

  @Post(':caregiverId/bonuses')
  @ApiOperation({ summary: 'Award a bonus to a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Bonus awarded' })
  async awardBonus(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.financialService.awardBonus({ ...data, caregiverId });
  }

  @Get(':caregiverId/bonuses')
  @ApiOperation({ summary: 'List bonuses for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of bonuses' })
  async listBonuses(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.listCaregiverBonuses(caregiverId);
  }

  @Post('bonuses/:id/approve')
  @ApiOperation({ summary: 'Approve a bonus' })
  @ApiParam({ name: 'id', description: 'Bonus UUID' })
  @ApiResponse({ status: 200, description: 'Bonus approved' })
  async approveBonus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.financialService.approveBonus(id, body.approvedBy);
  }

  // ===== PENALTIES =====

  @Post(':caregiverId/penalties')
  @ApiOperation({ summary: 'Issue a penalty to a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Penalty issued' })
  async issuePenalty(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.financialService.issuePenalty({ ...data, caregiverId });
  }

  @Get(':caregiverId/penalties')
  @ApiOperation({ summary: 'List penalties for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of penalties' })
  async listPenalties(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.listCaregiverPenalties(caregiverId);
  }

  @Post('penalties/:id/appeal')
  @ApiOperation({ summary: 'Appeal a penalty' })
  @ApiParam({ name: 'id', description: 'Penalty UUID' })
  @ApiResponse({ status: 200, description: 'Appeal submitted' })
  async appealPenalty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ) {
    return this.financialService.appealPenalty(id, body.reason);
  }

  @Post('penalties/:id/resolve-appeal')
  @ApiOperation({ summary: 'Resolve a penalty appeal' })
  @ApiParam({ name: 'id', description: 'Penalty UUID' })
  @ApiResponse({ status: 200, description: 'Appeal resolved' })
  async resolvePenaltyAppeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reviewedBy: string; decision: string; waive: boolean },
  ) {
    return this.financialService.resolvePenaltyAppeal(
      id,
      body.reviewedBy,
      body.decision,
      body.waive,
    );
  }

  // ===== BANK ACCOUNTS =====

  @Post(':caregiverId/bank-accounts')
  @ApiOperation({ summary: 'Add a bank account for direct deposit' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Bank account added' })
  async addBankAccount(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.financialService.addBankAccount({ ...data, caregiverId });
  }

  @Get(':caregiverId/bank-accounts')
  @ApiOperation({ summary: 'List bank accounts for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of bank accounts' })
  async listBankAccounts(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.listCaregiverBankAccounts(caregiverId);
  }

  @Post('bank-accounts/:id/verify')
  @ApiOperation({ summary: 'Verify a bank account' })
  @ApiParam({ name: 'id', description: 'Bank account UUID' })
  @ApiResponse({ status: 200, description: 'Bank account verified' })
  async verifyBankAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.verifyBankAccount(id);
  }

  // ===== TAX INFO =====

  @Post(':caregiverId/tax-info')
  @ApiOperation({ summary: 'Submit tax information' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Tax info saved' })
  async saveTaxInfo(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.financialService.saveTaxInfo({ ...data, caregiverId });
  }

  @Get(':caregiverId/tax-info')
  @ApiOperation({ summary: 'Get current tax information' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Current tax info' })
  async getCurrentTaxInfo(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.getCurrentTaxInfo(caregiverId);
  }

  @Get(':caregiverId/tax-info/history')
  @ApiOperation({ summary: 'Get tax information history' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Tax info history' })
  async getTaxInfoHistory(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.financialService.listTaxInfoHistory(caregiverId);
  }
}

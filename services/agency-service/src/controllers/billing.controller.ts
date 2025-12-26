import { 
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';

@Controller('agencies/:agencyId/billing')
@ApiTags('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Invoices
  @Get('invoices')
  @ApiOperation({ summary: 'List agency invoices' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getInvoices(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.billingService.getInvoices(agencyId, query);
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string
  ) {
    return this.billingService.getInvoice(agencyId, invoiceId);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice' })
  async createInvoice(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.billingService.createInvoice(agencyId, dto);
  }

  @Post('invoices/generate')
  @ApiOperation({ summary: 'Generate invoices for billing period' })
  async generateInvoices(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: { startDate: string; endDate: string }
  ) {
    return this.billingService.generateInvoices(agencyId, dto);
  }

  @Patch('invoices/:invoiceId/send')
  @ApiOperation({ summary: 'Send invoice to client' })
  async sendInvoice(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string
  ) {
    return this.billingService.sendInvoice(agencyId, invoiceId);
  }

  // Payments
  @Get('payments')
  @ApiOperation({ summary: 'List payments' })
  async getPayments(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.billingService.getPayments(agencyId, query);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record payment' })
  async recordPayment(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.billingService.recordPayment(agencyId, dto);
  }

  // Summary and Reports
  @Get('summary')
  @ApiOperation({ summary: 'Get billing summary' })
  async getSummary(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('period') period: string
  ) {
    return this.billingService.getSummary(agencyId, period);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenue(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.billingService.getRevenue(agencyId, startDate, endDate);
  }

  @Get('outstanding')
  @ApiOperation({ summary: 'Get outstanding balances' })
  async getOutstanding(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.billingService.getOutstanding(agencyId);
  }

  // Rates
  @Get('rates')
  @ApiOperation({ summary: 'Get agency billing rates' })
  async getRates(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.billingService.getRates(agencyId);
  }

  @Put('rates')
  @ApiOperation({ summary: 'Update billing rates' })
  async updateRates(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.billingService.updateRates(agencyId, dto);
  }
}


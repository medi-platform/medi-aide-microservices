import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'payment' };
  }

  @Get()
  list() {
    return this.payments.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.payments.findById(id);
  }

  @Post('process')
  async processPayment(@Body() data: any) {
    return this.payments.processPayment(data);
  }
}

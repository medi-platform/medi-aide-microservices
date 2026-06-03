import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { PaymentMethod, PaymentType, PaymentStatus, RefundReason } from '../interfaces/payment.interface';

class CreatePaymentIntentDto {
  amount!: number;
  payerId!: string;
  payerType!: 'patient' | 'family' | 'agency' | 'insurance';
  paymentMethod!: PaymentMethod;
  paymentType!: PaymentType;
  visitId?: string;
  invoiceId?: string;
  payeeId?: string;
  payeeType?: 'caregiver' | 'agency';
  description?: string;
  metadata?: Record<string, unknown>;
}

class ConfirmPaymentDto {
  paymentMethodId?: string;
}

class RefundDto {
  amount!: number;
  reason!: RefundReason;
  initiatedBy!: string;
  notes?: string;
}

@Controller('payments')
@ApiTags('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  async createIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createPaymentIntent(
      dto.amount,
      dto.payerId,
      dto.payerType,
      dto.paymentMethod,
      dto.paymentType,
      dto.visitId,
      dto.invoiceId,
      dto.payeeId,
      dto.payeeType,
      dto.description,
      dto.metadata,
    );
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentService.confirmPayment(id, dto.paymentMethodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.getById(id);
  }

  @Get('payer/:payerId')
  @ApiOperation({ summary: 'Get payments by payer' })
  @ApiQuery({ name: 'status', required: false })
  async getByPayer(
    @Param('payerId', ParseUUIDPipe) payerId: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.paymentService.getByPayer(payerId, status);
  }

  @Get('visit/:visitId')
  @ApiOperation({ summary: 'Get payments by visit' })
  async getByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.paymentService.getByVisit(visitId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a refund' })
  @ApiResponse({ status: 201, description: 'Refund processed' })
  async refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundDto,
  ) {
    return this.paymentService.refund(
      id,
      dto.amount,
      dto.reason,
      dto.initiatedBy,
      dto.notes,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.cancel(id);
  }
}

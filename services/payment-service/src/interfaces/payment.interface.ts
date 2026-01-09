/**
 * Payment Service Interfaces
 */

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIRECT_DEBIT = 'direct_debit',
  INSURANCE = 'insurance',
  WALLET = 'wallet',
}

export enum PaymentType {
  VISIT = 'visit',
  SUBSCRIPTION = 'subscription',
  INVOICE = 'invoice',
  DEPOSIT = 'deposit',
  REFUND = 'refund',
}

export enum RefundReason {
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  SERVICE_NOT_PROVIDED = 'service_not_provided',
  OTHER = 'other',
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
  paymentMethodId?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: RefundReason;
}

export interface PayoutResult {
  id: string;
  amount: number;
  status: 'pending' | 'in_transit' | 'paid' | 'failed';
  arrivalDate?: Date;
}

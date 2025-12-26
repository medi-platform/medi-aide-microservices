import { z } from 'zod';
import { BaseEventSchema } from '../base';

/**
 * Billing Domain Events
 */

export const InvoiceCreatedPayloadSchema = z.object({
  invoiceId: z.string().uuid(),
  agencyId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  invoiceNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('CAD'),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
    visitId: z.string().uuid().optional(),
  })),
  dueDate: z.string().date(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
});

export const InvoiceCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('billing.invoice.created'),
  payload: InvoiceCreatedPayloadSchema,
});

export type InvoiceCreatedEvent = z.infer<typeof InvoiceCreatedEventSchema>;

export const PaymentReceivedPayloadSchema = z.object({
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('CAD'),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'insurance', 'government']),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime(),
});

export const PaymentReceivedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('billing.payment.received'),
  payload: PaymentReceivedPayloadSchema,
});

export type PaymentReceivedEvent = z.infer<typeof PaymentReceivedEventSchema>;

export const ClaimSubmittedPayloadSchema = z.object({
  claimId: z.string().uuid(),
  patientId: z.string().uuid(),
  insuranceId: z.string().uuid(),
  visitIds: z.array(z.string().uuid()),
  totalAmount: z.number().positive(),
  submittedAt: z.string().datetime(),
  expectedPaymentDate: z.string().date().optional(),
});

export const ClaimSubmittedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('billing.claim.submitted'),
  payload: ClaimSubmittedPayloadSchema,
});

export type ClaimSubmittedEvent = z.infer<typeof ClaimSubmittedEventSchema>;


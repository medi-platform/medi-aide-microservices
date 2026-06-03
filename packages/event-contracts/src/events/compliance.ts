import { z } from 'zod';
import { BaseEventSchema } from '../base';

/**
 * Compliance Domain Events
 */

export const DocumentUploadedPayloadSchema = z.object({
  documentId: z.string().uuid(),
  ownerId: z.string().uuid(),
  ownerType: z.enum(['caregiver', 'patient', 'agency']),
  documentType: z.enum(['license', 'certification', 'insurance', 'id', 'contract', 'other']),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  expirationDate: z.string().date().optional(),
  requiresVerification: z.boolean(),
});

export const DocumentUploadedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('documents.uploaded'),
  payload: DocumentUploadedPayloadSchema,
});

export type DocumentUploadedEvent = z.infer<typeof DocumentUploadedEventSchema>;

export const ComplianceViolationPayloadSchema = z.object({
  violationId: z.string().uuid(),
  entityId: z.string().uuid(),
  entityType: z.enum(['caregiver', 'agency', 'visit']),
  violationType: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string(),
  regulationReference: z.string().optional(),
  detectedAt: z.string().datetime(),
  dueDate: z.string().date().optional(),
});

export const ComplianceViolationEventSchema = BaseEventSchema.extend({
  eventType: z.literal('compliance.violation.detected'),
  payload: ComplianceViolationPayloadSchema,
});

export type ComplianceViolationEvent = z.infer<typeof ComplianceViolationEventSchema>;


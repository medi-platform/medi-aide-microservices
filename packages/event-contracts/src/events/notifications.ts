import { z } from 'zod';
import { BaseEventSchema } from '../base';

/**
 * Notifications Domain Events
 */

export const NotificationRequestedPayloadSchema = z.object({
  notificationId: z.string().uuid(),
  recipientId: z.string().uuid(),
  recipientType: z.enum(['user', 'caregiver', 'patient', 'agency']),
  channel: z.enum(['push', 'email', 'sms', 'in_app']),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']),
  metadata: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const NotificationRequestedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('notifications.requested'),
  payload: NotificationRequestedPayloadSchema,
});

export type NotificationRequestedEvent = z.infer<typeof NotificationRequestedEventSchema>;

export const NotificationSentPayloadSchema = z.object({
  notificationId: z.string().uuid(),
  recipientId: z.string().uuid(),
  channel: z.enum(['push', 'email', 'sms', 'in_app']),
  sentAt: z.string().datetime(),
  externalId: z.string().optional(),
});

export const NotificationSentEventSchema = BaseEventSchema.extend({
  eventType: z.literal('notifications.sent'),
  payload: NotificationSentPayloadSchema,
});

export type NotificationSentEvent = z.infer<typeof NotificationSentEventSchema>;


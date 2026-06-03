import { z } from 'zod';
import { BaseEventSchema } from '../base';

/**
 * Scheduling Domain Events
 */

export const ShiftStartedPayloadSchema = z.object({
  shiftId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  patientId: z.string().uuid(),
  agencyId: z.string().uuid().optional(),
  scheduledStartTime: z.string().datetime(),
  actualStartTime: z.string().datetime(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  visitType: z.enum(['scheduled', 'on_demand', 'respite', 'emergency']),
});

export const ShiftStartedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('scheduling.shift.started'),
  payload: ShiftStartedPayloadSchema,
});

export type ShiftStartedEvent = z.infer<typeof ShiftStartedEventSchema>;

export const ShiftCompletedPayloadSchema = z.object({
  shiftId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  patientId: z.string().uuid(),
  scheduledEndTime: z.string().datetime(),
  actualEndTime: z.string().datetime(),
  durationMinutes: z.number(),
  tasksCompleted: z.array(z.string()),
  notes: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const ShiftCompletedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('scheduling.shift.completed'),
  payload: ShiftCompletedPayloadSchema,
});

export type ShiftCompletedEvent = z.infer<typeof ShiftCompletedEventSchema>;

export const VisitScheduledPayloadSchema = z.object({
  visitId: z.string().uuid(),
  shiftId: z.string().uuid().optional(),
  caregiverId: z.string().uuid(),
  patientId: z.string().uuid(),
  scheduledDate: z.string().date(),
  scheduledStartTime: z.string(),
  scheduledEndTime: z.string(),
  visitType: z.enum(['routine', 'assessment', 'therapy', 'medication', 'personal_care']),
  recurrence: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly']).optional(),
});

export const VisitScheduledEventSchema = BaseEventSchema.extend({
  eventType: z.literal('scheduling.visit.scheduled'),
  payload: VisitScheduledPayloadSchema,
});

export type VisitScheduledEvent = z.infer<typeof VisitScheduledEventSchema>;


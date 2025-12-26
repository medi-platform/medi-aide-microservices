import { z } from 'zod';
import { BaseEventSchema } from '../base';

/**
 * Care Domain Events
 */

export const CarePlanCreatedPayloadSchema = z.object({
  carePlanId: z.string().uuid(),
  patientId: z.string().uuid(),
  createdBy: z.string().uuid(),
  title: z.string(),
  goals: z.array(z.object({
    goalId: z.string().uuid(),
    description: z.string(),
    targetDate: z.string().date().optional(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
});

export const CarePlanCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('care.plan.created'),
  payload: CarePlanCreatedPayloadSchema,
});

export type CarePlanCreatedEvent = z.infer<typeof CarePlanCreatedEventSchema>;

export const CareRequestMatchedPayloadSchema = z.object({
  requestId: z.string().uuid(),
  patientId: z.string().uuid(),
  matchedCaregiverId: z.string().uuid(),
  matchScore: z.number().min(0).max(100),
  matchFactors: z.object({
    skillsMatch: z.number(),
    availabilityMatch: z.number(),
    locationMatch: z.number(),
    languageMatch: z.number(),
    culturalMatch: z.number().optional(),
  }),
  alternativeCaregivers: z.array(z.object({
    caregiverId: z.string().uuid(),
    score: z.number(),
  })).optional(),
});

export const CareRequestMatchedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('care.request.matched'),
  payload: CareRequestMatchedPayloadSchema,
});

export type CareRequestMatchedEvent = z.infer<typeof CareRequestMatchedEventSchema>;


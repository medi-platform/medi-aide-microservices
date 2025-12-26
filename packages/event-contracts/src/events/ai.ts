import { z } from 'zod';
import { BaseEventSchema } from '../base';

/**
 * AI/ML Domain Events
 */

export const MatchScoredPayloadSchema = z.object({
  matchId: z.string().uuid(),
  requestId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  patientId: z.string().uuid(),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  components: z.object({
    skillsScore: z.number(),
    availabilityScore: z.number(),
    locationScore: z.number(),
    experienceScore: z.number(),
    languageScore: z.number(),
    culturalScore: z.number().optional(),
    ratingScore: z.number().optional(),
  }),
  modelVersion: z.string(),
  processingTimeMs: z.number(),
});

export const MatchScoredEventSchema = BaseEventSchema.extend({
  eventType: z.literal('ai.match.scored'),
  payload: MatchScoredPayloadSchema,
});

export type MatchScoredEvent = z.infer<typeof MatchScoredEventSchema>;

export const BurnoutPredictedPayloadSchema = z.object({
  caregiverId: z.string().uuid(),
  riskLevel: z.enum(['critical', 'high', 'moderate', 'low']),
  riskScore: z.number().min(0).max(100),
  factors: z.array(z.object({
    factor: z.string(),
    weight: z.number(),
    value: z.number(),
  })),
  recommendations: z.array(z.string()),
  predictedAt: z.string().datetime(),
  modelVersion: z.string(),
});

export const BurnoutPredictedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('ai.burnout.predicted'),
  payload: BurnoutPredictedPayloadSchema,
});

export type BurnoutPredictedEvent = z.infer<typeof BurnoutPredictedEventSchema>;

export const RiskPredictedPayloadSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.enum(['patient', 'caregiver', 'visit', 'agency']),
  riskType: z.string(),
  riskLevel: z.enum(['critical', 'high', 'moderate', 'low']),
  probability: z.number().min(0).max(1),
  factors: z.array(z.object({
    name: z.string(),
    contribution: z.number(),
  })),
  modelVersion: z.string(),
});

export const RiskPredictedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('ai.risk.predicted'),
  payload: RiskPredictedPayloadSchema,
});

export type RiskPredictedEvent = z.infer<typeof RiskPredictedEventSchema>;


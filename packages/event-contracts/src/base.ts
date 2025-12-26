import { z } from 'zod';

/**
 * Base Event Schema
 * 
 * All events in the system must extend this base schema.
 * Provides common metadata for tracing and auditing.
 */
export const BaseEventSchema = z.object({
  /** Unique event identifier */
  eventId: z.string().uuid(),
  
  /** Event type (e.g., 'shift.started', 'document.uploaded') */
  eventType: z.string(),
  
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: z.string().datetime(),
  
  /** Service that produced this event */
  source: z.object({
    serviceName: z.string(),
    serviceVersion: z.string(),
    instanceId: z.string().optional(),
  }),
  
  /** Correlation ID for distributed tracing */
  correlationId: z.string().optional(),
  
  /** Causation ID - the event that caused this event */
  causationId: z.string().optional(),
  
  /** Schema version for backward compatibility */
  schemaVersion: z.string().default('1.0.0'),
  
  /** Actor who triggered this event */
  actor: z.object({
    userId: z.string().optional(),
    serviceId: z.string().optional(),
    actorType: z.enum(['user', 'system', 'service', 'scheduler']),
  }).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Create an event with base metadata
 */
export function createEvent<T extends object>(
  eventType: string,
  payload: T,
  options: {
    serviceName: string;
    serviceVersion?: string;
    correlationId?: string;
    causationId?: string;
    actor?: BaseEvent['actor'];
  }
): BaseEvent & { payload: T } {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    source: {
      serviceName: options.serviceName,
      serviceVersion: options.serviceVersion || '1.0.0',
    },
    correlationId: options.correlationId,
    causationId: options.causationId,
    schemaVersion: '1.0.0',
    actor: options.actor,
    payload,
  };
}

/**
 * Validate an event against its schema
 */
export function validateEvent<T>(
  event: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(event);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}


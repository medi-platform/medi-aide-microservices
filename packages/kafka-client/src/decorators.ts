import 'reflect-metadata';
import { z } from 'zod';

const EVENT_HANDLER_METADATA_KEY = 'kafka:event_handler';

export interface EventHandlerMetadata {
  eventType: string;
  schema?: z.ZodSchema;
  topic?: string;
}

/**
 * Event Handler Decorator
 * 
 * Marks a method as a Kafka event handler.
 * 
 * @example
 * ```typescript
 * @KafkaEventHandler({
 *   eventType: 'user.created',
 *   schema: UserCreatedEventSchema,
 * })
 * async handleUserCreated(event: EventEnvelope<UserCreatedEvent>) {
 *   // Handle event
 * }
 * ```
 */
export function KafkaEventHandler(metadata: EventHandlerMetadata): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingHandlers = Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target.constructor) || [];
    existingHandlers.push({
      ...metadata,
      methodName: propertyKey,
    });
    Reflect.defineMetadata(EVENT_HANDLER_METADATA_KEY, existingHandlers, target.constructor);
  };
}

/**
 * Get all registered event handlers from a class
 */
export function getEventHandlers(target: Function): Array<EventHandlerMetadata & { methodName: string }> {
  return Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target) || [];
}

/**
 * Subscribe to Topics Decorator
 * 
 * Marks a class as a Kafka consumer that subscribes to specific topics.
 */
export function KafkaSubscriber(topics: string[]): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata('kafka:topics', topics, target);
  };
}

/**
 * Get subscribed topics from a class
 */
export function getSubscribedTopics(target: Function): string[] {
  return Reflect.getMetadata('kafka:topics', target) || [];
}


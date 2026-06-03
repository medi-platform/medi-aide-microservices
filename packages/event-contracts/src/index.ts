/**
 * @medi-aide/event-contracts
 * 
 * Centralized Kafka event contracts and schemas for the microservices architecture.
 * All services use these schemas to ensure consistent event structures.
 */

export * from './base';
export * from './topics';
export * from './events/scheduling';
export * from './events/care';
export * from './events/notifications';
export * from './events/compliance';
export * from './events/ai';
export * from './events/billing';


export interface NotificationCreatedEvent {
  version: 'v1';
  eventType: 'notification.created';
  id: string;
  userId: string;
  recipient: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  createdAt: string;
}

export type DomainEvent = NotificationCreatedEvent;




import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { NotificationModule } from './notification.module';

class NotificationService extends BaseService {
  constructor() {
    super(NotificationModule, {
      serviceName: 'notification-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4010,
      enableConsul: true,
      enableTracing: true,
      enableSwagger: true,
      enableRabbitMQ: true,
      enableGrpc: true,
      grpcPackage: 'notification',
      grpcProtoPath: './proto/notification.proto',
      globalPrefix: 'notifications',
    });
  }
}

// Bootstrap the service
const service = new NotificationService();
service.bootstrap().catch(error => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});
import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { NotificationModule } from './notification.module';

class NotificationServiceRunner extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    super(NotificationModule, {
      serviceName: 'notification-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4010,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: false, // Disabled until proto file is created
      grpcPackage: 'notification',
      grpcProtoPath: './proto/notification.proto',
      // No global prefix so upstream receives /health, /metrics directly
      globalPrefix: '',
    });
  }
}

// Bootstrap the service
const service = new NotificationServiceRunner();
service.bootstrap().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});
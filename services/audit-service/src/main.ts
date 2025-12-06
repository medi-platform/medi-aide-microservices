import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { AuditModule } from './audit.module';

class AuditServiceRunner extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';
    
    super(AuditModule, {
      serviceName: 'audit-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4017,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: false,
      grpcPackage: 'audit'.replace('-', '_'),
      grpcProtoPath: './proto/audit.proto',
      // Use root so Kong strip_path works and health checks are lightweight
      globalPrefix: '',
    });
  }
}

// Bootstrap the service
const service = new AuditServiceRunner();
service.bootstrap().catch(error => {
  console.error('Failed to start audit-service:', error);
  process.exit(1);
});

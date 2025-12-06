import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { UserModule } from './user.module';

class UuserUservice extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';
    
    super(UserModule, {
      serviceName: 'user-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4012,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: !disableGrpc,
      grpcPackage: 'user'.replace('-', '_'),
      grpcProtoPath: './proto/user.proto',
      globalPrefix: 'users',
    });
  }
}

// Bootstrap the service
const service = new UuserUservice();
service.bootstrap().catch(error => {
  console.error('Failed to start user-service:', error);
  process.exit(1);
});

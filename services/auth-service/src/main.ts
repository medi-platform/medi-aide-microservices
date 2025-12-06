import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { AuthModule } from './auth.module';

class UauthUservice extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';
    
    super(AuthModule, {
      serviceName: 'auth-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4011,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: !disableGrpc,
      grpcPackage: 'auth',
      grpcProtoPath: './proto/auth.proto',
      globalPrefix: 'auth',
    });
  }
}

// Bootstrap the service
const service = new UauthUservice();
service.bootstrap().catch(error => {
  console.error('Failed to start auth-service:', error);
  process.exit(1);
});
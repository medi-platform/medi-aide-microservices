import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { aiModule } from './ai.module';

class UaiUservice extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';
    
    super(aiModule, {
      serviceName: 'ai-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4018,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: !disableGrpc,
      grpcPackage: 'ai'.replace('-', '_'),
      grpcProtoPath: './proto/ai.proto',
      globalPrefix: 'ai',
    });
  }
}

// Bootstrap the service
const service = new UaiUservice();
service.bootstrap().catch(error => {
  console.error('Failed to start ai-service:', error);
  process.exit(1);
});

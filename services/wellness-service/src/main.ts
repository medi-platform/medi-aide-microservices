import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { WellnessModule } from './wellness.module';

class UwellnessUservice extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';
    
    super(WellnessModule, {
      serviceName: 'wellness-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4014,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: !disableGrpc,
      grpcPackage: 'wellness'.replace('-', '_'),
      grpcProtoPath: './proto/wellness.proto',
      globalPrefix: '',
    });
  }
}

// Bootstrap the service
const service = new UwellnessUservice();
service.bootstrap().catch(error => {
  console.error('Failed to start wellness-service:', error);
  process.exit(1);
});

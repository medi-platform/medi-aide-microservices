import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { EvvModule } from './evv.module';

class UevvUservice extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';

    super(EvvModule, {
      serviceName: 'evv-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: 4020,
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableKafka: !disableMq,
      enableGrpc: !disableGrpc,
      grpcPackage: 'evv'.replace('-', '_'),
      grpcProtoPath: './proto/evv.proto',
      // Kong routes are mounted under /api/v1/*.
      // We keep EVV endpoints under /api/v1/evv/* for parity (see gateway/kong.yaml).
      globalPrefix: 'api/v1',
    });
  }
}

// Bootstrap the service
const service = new UevvUservice();
service.bootstrap().catch(error => {
  console.error('Failed to start evv-service:', error);
  process.exit(1);
});

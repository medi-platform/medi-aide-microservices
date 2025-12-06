import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Module({})
export class ConsulModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('ConsulModule');
  private consul: any;
  private serviceId: string = '';
  private serviceName: string = '';
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    this.serviceName = process.env.SERVICE_NAME || 'unknown-service';
  }

  async onModuleInit() {
    try {
      // Dynamic import to avoid build issues
      const Consul = (await import('consul')).default;
      
      this.consul = new Consul({
        host: process.env.CONSUL_HOST || 'stage3-consul',
        port: (process.env.CONSUL_PORT || '8500'),
      });

      const hostname = os.hostname();
      const port = this.configService.get<number>('PORT') || 3000;
      this.serviceId = `${this.serviceName}-${hostname}-${port}`;

      const registration = {
        id: this.serviceId,
        name: this.serviceName,
        address: process.env.SERVICE_ADDRESS || 'host.docker.internal',
        port: port,
        tags: [
          'stage3',
          'microservice',
          `version:${process.env.SERVICE_VERSION || '1.0.0'}`,
        ],
        check: {
          http: `http://host.docker.internal:${port}/${process.env.SERVICE_ROUTE_PREFIX || this.serviceName.replace('-service', '')}/health`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
      };

      await this.consul.agent.service.register(registration);
      this.logger.log(`Service registered with Consul: ${this.serviceName} (${this.serviceId})`);

      // Keep service registered with periodic health checks
      this.checkInterval = setInterval(async () => {
        try {
          await this.consul.agent.check.pass({ id: `service:${this.serviceId}` });
        } catch (error: unknown) {
          this.logger.warn(`Health check pass failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }, 8000);

    } catch (error: unknown) {
      this.logger.warn(`Failed to register with Consul: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.warn('Service will continue without Consul registration');
    }
  }

  async onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    try {
      if (this.consul && this.serviceId) {
        await this.consul.agent.service.deregister(this.serviceId);
        this.logger.log(`Service deregistered from Consul: ${this.serviceId}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to deregister from Consul: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Consul from 'consul';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

export interface ConsulConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  token?: string;
  datacenter?: string;
  serviceName: string;
  serviceId?: string;
  servicePort: number;
  serviceAddress?: string;
  tags?: string[];
  meta?: Record<string, string>;
  check?: ConsulHealthCheck;
  weights?: {
    passing: number;
    warning: number;
  };
  enableFailover?: boolean;
  deregisterCriticalAfter?: string;
}

export interface ConsulHealthCheck {
  http?: string;
  tcp?: string;
  grpc?: string;
  interval?: string;
  timeout?: string;
  deregisterCriticalServiceAfter?: string;
  tlsSkipVerify?: boolean;
  method?: string;
  header?: Record<string, string[]>;
  body?: string;
  status?: string;
}

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsulService.name);
  private consul: any;
  private serviceId: string;
  private config: ConsulConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private registrationRetryInterval?: NodeJS.Timeout;
  private isRegistered = false;
  private readonly maxRetries = 10;
  private retryCount = 0;

  constructor(config: ConsulConfig) {
    this.config = {
      host: process.env.CONSUL_HOST || config.host || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || '') || config.port || 8500,
      secure: process.env.CONSUL_SECURE === 'true' || config.secure || false,
      token: process.env.CONSUL_TOKEN || config.token,
      datacenter: process.env.CONSUL_DATACENTER || config.datacenter || 'dc1',
      ...config,
    };

    // Generate unique service ID
    this.serviceId = this.config.serviceId || 
      `${this.config.serviceName}-${os.hostname()}-${this.config.servicePort}-${uuidv4().split('-')[0]}`;

    // Initialize Consul client (consul exports a factory function, not a class)
    this.consul = Consul({
      host: this.config.host,
      port: String(this.config.port),
      secure: this.config.secure,
      defaults: {
        token: this.config.token,
        dc: this.config.datacenter,
      },
    });

    this.logger.log(`Consul client initialized for ${this.config.serviceName}`);
  }

  async onModuleInit() {
    await this.register();
    this.setupGracefulShutdown();
  }

  async onModuleDestroy() {
    await this.deregister();
  }

  async register(): Promise<void> {
    try {
      const serviceAddress = await this.getServiceAddress();
      
      const registration: any = {
        id: this.serviceId,
        name: this.config.serviceName,
        address: serviceAddress,
        port: this.config.servicePort,
        tags: [
          'stage3',
          'microservice',
          `version:${process.env.SERVICE_VERSION || '1.0.0'}`,
          `env:${process.env.NODE_ENV || 'development'}`,
          ...(this.config.tags || []),
        ],
        meta: {
          version: process.env.SERVICE_VERSION || '1.0.0',
          commit: process.env.GIT_COMMIT || 'unknown',
          buildTime: process.env.BUILD_TIME || new Date().toISOString(),
          ...this.config.meta,
        },
        check: this.buildHealthCheck(),
        weights: this.config.weights || {
          passing: 10,
          warning: 1,
        },
      };

      await this.consul.agent.service.register(registration);
      this.isRegistered = true;
      this.retryCount = 0;
      
      this.logger.log(
        `Service registered successfully: ${this.config.serviceName} (${this.serviceId}) at ${serviceAddress}:${this.config.servicePort}`
      );

      // Enable maintenance mode if service is warming up
      if (process.env.WARMUP_DURATION) {
        await this.enableMaintenanceMode('Service warming up');
        setTimeout(() => {
          this.disableMaintenanceMode();
        }, parseInt(process.env.WARMUP_DURATION) * 1000);
      }

    } catch (error: unknown) {
      this.logger.error(`Failed to register service: ${this.getErrorMessage(error)}`);
      await this.scheduleRetry();
    }
  }

  async deregister(): Promise<void> {
    if (!this.isRegistered) return;

    try {
      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.registrationRetryInterval) {
        clearInterval(this.registrationRetryInterval);
      }

      // Enable maintenance mode before deregistering
      await this.enableMaintenanceMode('Service shutting down');
      
      // Wait for load balancer to stop sending traffic
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Deregister service
      await this.consul.agent.service.deregister(this.serviceId);
      this.isRegistered = false;
      
      this.logger.log(`Service deregistered: ${this.serviceId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to deregister service: ${this.getErrorMessage(error)}`);
    }
  }

  async enableMaintenanceMode(reason: string): Promise<void> {
    try {
      await this.consul.agent.service.maintenance({
        id: this.serviceId,
        enable: true,
        reason,
      });
      this.logger.log(`Maintenance mode enabled: ${reason}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to enable maintenance mode: ${this.getErrorMessage(error)}`);
    }
  }

  async disableMaintenanceMode(): Promise<void> {
    try {
      await this.consul.agent.service.maintenance({
        id: this.serviceId,
        enable: false,
      });
      this.logger.log('Maintenance mode disabled');
    } catch (error: unknown) {
      this.logger.error(`Failed to disable maintenance mode: ${this.getErrorMessage(error)}`);
    }
  }

  // For HTTP checks, health status is determined by the endpoint.
  // This method is a no-op to maintain API compatibility.
  async updateHealthStatus(_status: 'passing' | 'warning' | 'critical', _output?: string): Promise<void> {
    return;
  }

  private buildHealthCheck(): any {
    const check = this.config.check || {};
    const baseUrl = `http://${this.getHealthCheckAddress()}:${this.config.servicePort}`;
    const healthPath = `/${this.config.serviceName.replace('-service', '')}/health`;

    return {
      id: `service:${this.serviceId}`,
      name: `Service '${this.config.serviceName}' health check`,
      notes: `Health check for ${this.config.serviceName}`,
      http: check.http || `${baseUrl}${healthPath}`,
      method: check.method || 'GET',
      interval: check.interval || '10s',
      timeout: check.timeout || '5s',
      deregistercriticalserviceafter: check.deregisterCriticalServiceAfter || '10m',
      tlsskipverify: !!check.tlsSkipVerify,
      header: check.header || {
        'User-Agent': ['Consul Health Check'],
      },
      status: check.status || 'critical', // Start as critical until service is ready
    };
  }

  private async getServiceAddress(): Promise<string> {
    if (this.config.serviceAddress) {
      return this.config.serviceAddress;
    }

    // In Docker, use container name or host.docker.internal
    if (process.env.DOCKER_CONTAINER_NAME) {
      return process.env.DOCKER_CONTAINER_NAME;
    }

    // In Kubernetes, use pod IP
    if (process.env.KUBERNETES_POD_IP) {
      return process.env.KUBERNETES_POD_IP;
    }

    // For local development
    if (process.env.NODE_ENV === 'development') {
      return 'host.docker.internal';
    }

    // Default to hostname
    return os.hostname();
  }

  private getHealthCheckAddress(): string {
    // Use host.docker.internal for Docker Desktop
    if (process.platform === 'darwin' || process.platform === 'win32') {
      return 'host.docker.internal';
    }
    
    // Use container name in production
    return this.config.serviceAddress || 'localhost';
  }

  private setupHealthCheckMaintenance(): void {
    // Periodic health status update
    this.healthCheckInterval = setInterval(async () => {
      if (this.isRegistered) {
        // Optionally, ping health endpoint or perform custom checks here
      }
    }, 30000);
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.log(`Received ${signal}, starting graceful shutdown...`);
        await this.deregister();
        process.exit(0);
      });
    });
  }

  private async scheduleRetry(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      this.logger.error(`Max registration retries (${this.maxRetries}) reached. Giving up.`);
      return;
    }

    this.retryCount++;
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // Exponential backoff, max 30s
    
    this.logger.log(`Scheduling registration retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
    
    this.registrationRetryInterval = setTimeout(async () => {
      await this.register();
    }, delay);
  }

  // Utility methods for service discovery
  async getService(serviceName: string): Promise<any[]> {
    try {
      const services: any = await this.consul.health.service({
        service: serviceName,
        passing: true,
      });
      return (services || []).map((s: any) => s.Service).filter(Boolean);
    } catch (error: unknown) {
      this.logger.error(`Failed to get service ${serviceName}: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  async getAllServices(): Promise<string[]> {
    try {
      const services: any = await this.consul.catalog.services();
      return Object.keys(services || {});
    } catch (error: unknown) {
      this.logger.error(`Failed to get all services: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  // Key-Value store operations
  async setKV(key: string, value: any): Promise<boolean> {
    try {
      const result = await this.consul.kv.set({
        key: `${this.config.serviceName}/${key}`,
        value: JSON.stringify(value),
      });
      return result;
    } catch (error: unknown) {
      this.logger.error(`Failed to set KV ${key}: ${this.getErrorMessage(error)}`);
      return false;
    }
  }

  async getKV(key: string): Promise<any> {
    try {
      const result: any = await this.consul.kv.get({
        key: `${this.config.serviceName}/${key}`,
      });
      return result && result.Value ? JSON.parse(result.Value) : null;
    } catch (error: unknown) {
      this.logger.error(`Failed to get KV ${key}: ${this.getErrorMessage(error)}`);
      return null;
    }
  }

  // Watch for configuration changes
  watchKV(key: string, callback: (value: any) => void): void {
    const watcher = this.consul.watch({
      method: this.consul.kv.get,
      options: { key: `${this.config.serviceName}/${key}` },
    });

    watcher.on('change', (data: any) => {
      if (data) {
        try {
          callback(JSON.parse(data.Value));
        } catch {
          callback(data.Value);
        }
      }
    });

    watcher.on('error', (error: unknown) => {
      this.logger.error(`KV watch error for ${key}: ${this.getErrorMessage(error)}`);
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}

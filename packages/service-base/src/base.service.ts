import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  Transport, 
  MicroserviceOptions,
  RmqOptions,
  GrpcOptions,
} from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConsulModule, ConsulService } from '@medi-aide/consul-integration';
import { TracerService } from '@medi-aide/service-framework';
import { join } from 'path';

export interface ServiceOptions {
  serviceName: string;
  serviceVersion?: string;
  defaultPort: number;
  enableConsul?: boolean;
  enableTracing?: boolean;
  enableSwagger?: boolean;
  enableGrpc?: boolean;
  enableRabbitMQ?: boolean;
  enableKafka?: boolean;
  enableTemporal?: boolean;
  grpcPackage?: string;
  grpcProtoPath?: string;
  corsOrigins?: string[];
  globalPrefix?: string;
}

export abstract class BaseService {
  protected app!: INestApplication;
  protected logger: Logger;
  protected consulService?: ConsulService;
  protected tracerService?: TracerService;
  protected config!: ConfigService;

  constructor(
    protected readonly moduleClass: any,
    protected readonly options: ServiceOptions
  ) {
    this.logger = new Logger(options.serviceName);
  }

  async bootstrap(): Promise<void> {
    try {
      // Check if running in health-only mode
      const healthOnly = process.env.HEALTH_ONLY === 'true';
      
      if (healthOnly) {
        // Run a simple health server without full NestJS bootstrap
        this.runHealthOnlyServer();
        return;
      }

      // Initialize tracer if enabled
      if (this.options.enableTracing !== false) {
        this.tracerService = new TracerService({
          serviceName: this.options.serviceName,
          serviceVersion: this.options.serviceVersion || process.env.SERVICE_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger-collector:14268/api/traces',
        });
        // TracerService initializes SDK in constructor; no explicit start
      }

      // Create the application
      this.app = await NestFactory.create(this.moduleClass, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      });

      // Get config service
      this.config = this.app.get(ConfigService);

      // Set global prefix (allow empty string to mean no prefix)
      // Exclude health check routes from the prefix so Docker healthchecks work
      const globalPrefix = this.options.globalPrefix ?? this.options.serviceName.replace('-service', '');
      if (globalPrefix !== '') {
        this.app.setGlobalPrefix(globalPrefix, {
          exclude: ['health', 'ping', '/'],
        });
      }

      // Enable security headers
      this.app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      }));

      // Enable CORS
      this.app.enableCors({
        origin: this.options.corsOrigins || [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8100',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Request-ID',
          'X-Trace-ID',
          'X-Canary-Version',
        ],
      });

      // Global validation pipe
      this.app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
          validationError: {
            target: false,
            value: false,
          },
        })
      );

      // Enable Swagger if configured
      if (this.options.enableSwagger && process.env.NODE_ENV !== 'production') {
        this.setupSwagger();
      }

      // Connect microservices
      await this.connectMicroservices();

      // Start all microservices
      await this.app.startAllMicroservices();

      // Listen on HTTP port
      const port = parseInt(String(process.env.PORT ?? this.options.defaultPort), 10);
      await this.app.listen(port, '0.0.0.0');

      this.logger.log(`Service is running on port ${port}`);
      const prefixSegment = globalPrefix !== '' ? `/${globalPrefix}` : '';
      this.logger.log(`Health check: http://localhost:${port}${prefixSegment}/health`);

      // Register with Consul if enabled
      if (this.options.enableConsul !== false) {
        await this.registerWithConsul(port);
      }

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error: unknown) {
      this.logger.error(`Failed to bootstrap service: ${this.getErrorMessage(error)}`, error instanceof Error ? error.stack : String(error));
      process.exit(1);
    }
  }

  private setupSwagger(): void {
    const config = new DocumentBuilder()
      .setTitle(`${this.options.serviceName} API`)
      .setDescription(`API documentation for ${this.options.serviceName}`)
      .setVersion(this.options.serviceVersion || '1.0.0')
      .addBearerAuth()
      .addServer(`http://localhost:${this.options.defaultPort}`)
      .addServer(`http://localhost:8100/stage3/api/v1/${this.options.serviceName.replace('-service', '')}`)
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api-docs', this.app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  private async connectMicroservices(): Promise<void> {
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';

    // Kafka microservice
    if (this.options.enableKafka && !disableMq) {
      const kafkaOptions: MicroserviceOptions = {
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: this.options.serviceName,
            brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
          },
          consumer: {
            groupId: `${this.options.serviceName}-group`,
          },
        },
      };
      this.app.connectMicroservice<MicroserviceOptions>(kafkaOptions);
    }

    // RabbitMQ microservice (legacy support)
    if (this.options.enableRabbitMQ && !disableMq) {
      const rmqOptions: RmqOptions = {
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@stage3-rabbitmq:5672'],
          queue: `${this.options.serviceName}_queue`,
          queueOptions: { durable: true },
          prefetchCount: 10,
          noAck: false,
        },
      };
      this.app.connectMicroservice<MicroserviceOptions>(rmqOptions);
    }

    // gRPC microservice
    if (this.options.enableGrpc && !disableGrpc) {
      const grpcOptions: GrpcOptions = {
        transport: Transport.GRPC,
        options: {
          package: this.options.grpcPackage || this.options.serviceName.replace('-', '_'),
          protoPath: this.options.grpcProtoPath || join(__dirname, '../proto/service.proto'),
          url: `0.0.0.0:${parseInt(process.env.GRPC_PORT || '50051')}`,
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      };
      this.app.connectMicroservice<MicroserviceOptions>(grpcOptions);
    }
  }

  private async registerWithConsul(port: number): Promise<void> {
    try {
      // Get Consul service from the app context
      this.consulService = this.app.get(ConsulService);
      // Service is already registered via ConsulModule.forRoot
      this.logger.log('Service registered with Consul');
    } catch (error: unknown) {
      this.logger.warn(`Consul registration not available: ${this.getErrorMessage(error)}`);
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.log(`Received ${signal}, starting graceful shutdown...`);
        try {
          if (this.tracerService) {
            await this.tracerService.shutdown();
          }
          await this.app.close();
          this.logger.log('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          this.logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async getServiceUrl(serviceName: string): Promise<string> {
    if (this.consulService) {
      const services = await this.consulService.getService(serviceName);
      if (services.length > 0) {
        const service = services[Math.floor(Math.random() * services.length)];
        return `http://${service.Address}:${service.Port}`;
      }
    }
    const envKey = `${serviceName.toUpperCase().replace('-', '_')}_URL`;
    return process.env[envKey] || `http://${serviceName}:${this.getDefaultPort(serviceName)}`;
  }

  private getDefaultPort(serviceName: string): number {
    const portMap: Record<string, number> = {
      'notification-service': 4010,
      'auth-service': 4011,
      'user-service': 4012,
      'visit-service': 4013,
      'wellness-service': 4014,
      'payment-service': 4015,
      'analytics-service': 4016,
      'audit-service': 4017,
      'ai-service': 4018,
      'care-plan-service': 4019,
      'evv-service': 4020,
      'file-service': 4021,
      'search-service': 4022,
      'matching-service': 4023,
      'training-service': 4024,
      'feedback-service': 4025,
      'communication-service': 4026,
    };
    return portMap[serviceName] || 4000;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private runHealthOnlyServer(): void {
    const http = require('http');
    const port = parseInt(String(process.env.PORT ?? this.options.defaultPort), 10);
    const serviceName = this.options.serviceName;
    const routePrefix = this.options.globalPrefix || process.env.SERVICE_ROUTE_PREFIX || serviceName.replace('-service', '');

    const server = http.createServer((req: any, res: any) => {
      // Handle both /health and /{route-prefix}/health
      if (req.url === '/health' || req.url === `/${routePrefix}/health`) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          service: serviceName,
          timestamp: new Date().toISOString(),
          mode: 'health-only',
          version: this.options.serviceVersion || '1.0.0',
          route: routePrefix
        }));
      } else if (req.url === '/metrics' || req.url === `/${routePrefix}/metrics`) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`# HELP ${serviceName.replace(/-/g, '_')}_up Service is up\n# TYPE ${serviceName.replace(/-/g, '_')}_up gauge\n${serviceName.replace(/-/g, '_')}_up 1\n`);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(port, '0.0.0.0', () => {
      this.logger.log(`Health-only server for ${serviceName} listening on port ${port}`);
      this.logger.log(`Health endpoints: /health and /${routePrefix}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        this.logger.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      this.logger.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        this.logger.log('Server closed');
        process.exit(0);
      });
    });
  }
}

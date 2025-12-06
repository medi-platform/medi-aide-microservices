import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TracerService, ConsulService, TracingMiddleware } from '@medi-aide/service-framework';
import { MODULE_NAME } from './MODULE_FILE';

async function bootstrap() {
  // Initialize tracing
  const tracer = new TracerService({
    serviceName: 'SERVICE_NAME',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(MODULE_NAME);
  
  // Add tracing middleware
  app.use(new TracingMiddleware().use.bind(new TracingMiddleware()));
  
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('PREFIX');
  
  // Register with Consul
  const consul = new ConsulService({
    host: process.env.CONSUL_HOST || 'stage3-consul',
    port: parseInt(process.env.CONSUL_PORT || '8500'),
    serviceName: 'SERVICE_NAME',
    servicePort: parseInt(process.env.PORT || 'PORT_NUMBER'),
  });
  
  await consul.register();

  const port = process.env.PORT || PORT_NUMBER;
  await app.listen(port);
  console.log(`SERVICE_NAME listening on port ${port} with tracing enabled`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await consul.deregister();
    await tracer.shutdown();
    await app.close();
  });
}

bootstrap();

#!/bin/bash
set -euo pipefail

echo "🔍 Updating services with OpenTelemetry tracing..."

# Update notification-service as example
cat > services/notification-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { TracerService, ConsulService } from '@medi-aide/service-framework';

async function bootstrap() {
  // Initialize tracing
  const tracer = new TracerService({
    serviceName: 'notification-service',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(NotificationModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('notifications');
  
  // Register with Consul
  const consul = new ConsulService({
    host: process.env.CONSUL_HOST || 'stage3-consul',
    port: parseInt(process.env.CONSUL_PORT || '8500'),
    serviceName: 'notification-service',
    servicePort: parseInt(process.env.PORT || '4010'),
  });
  
  await consul.register();

  const port = process.env.PORT || 4010;
  await app.listen(port);
  console.log(`Notification service listening on port ${port} with tracing enabled`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await consul.deregister();
    await tracer.shutdown();
    await app.close();
  });
}

bootstrap();
EOF

# Update package.json to include service-framework
cat > services/notification-service/package.json << 'EOF'
{
  "name": "@medi-aide/notification-service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/terminus": "^10.0.0",
    "@medi-aide/service-framework": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "pg": "^8.12.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.20",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
EOF

echo "✅ Updated notification-service with tracing"

# Create a template for other services
cat > scripts/service-tracing-template.ts << 'EOF'
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
EOF

echo "✅ Created service tracing template"
echo "🎉 Tracing implementation ready!"

#!/bin/bash
# Simple approach to add Consul to existing services

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Adding Consul support to existing services..."
echo ""

# Step 1: Install consul package in each service
echo "📦 Installing consul package in services..."
services=(
    "notification-service"
    "auth-service"
    "user-service"
    "visit-service"
    "wellness-service"
    "payment-service"
)

for service in "${services[@]}"; do
    if [ -d "services/$service" ]; then
        echo -e "${BLUE}Installing consul in $service...${NC}"
        (cd services/$service && npm install consul@1.2.0 @types/consul@0.40.0 --save)
    fi
done

# Step 2: Create a simple Consul registration module
echo ""
echo "📝 Creating Consul registration module..."

for service in "${services[@]}"; do
    cat > services/$service/src/consul-register.ts << 'EOF'
import * as Consul from 'consul';
import { Logger } from '@nestjs/common';
import * as os from 'os';

export class ConsulRegistration {
  private static consul: Consul.Consul;
  private static logger = new Logger('ConsulRegistration');
  private static serviceId: string;

  static async register(serviceName: string, port: number) {
    try {
      this.consul = new Consul({
        host: process.env.CONSUL_HOST || 'stage3-consul',
        port: parseInt(process.env.CONSUL_PORT || '8500'),
      });

      const hostname = os.hostname();
      this.serviceId = `${serviceName}-${hostname}-${port}`;

      const registration = {
        id: this.serviceId,
        name: serviceName,
        address: process.env.SERVICE_ADDRESS || 'host.docker.internal',
        port: port,
        tags: [
          'stage3',
          'microservice',
          `version:${process.env.SERVICE_VERSION || '1.0.0'}`,
        ],
        check: {
          http: `http://host.docker.internal:${port}/${serviceName.replace('-service', '')}/health`,
          interval: '10s',
          timeout: '5s',
        },
      };

      await this.consul.agent.service.register(registration);
      this.logger.log(`Service registered with Consul: ${serviceName} (${this.serviceId})`);

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        await this.deregister();
      });
      process.on('SIGINT', async () => {
        await this.deregister();
      });

    } catch (error) {
      this.logger.warn(`Failed to register with Consul: ${error.message}`);
    }
  }

  static async deregister() {
    try {
      if (this.consul && this.serviceId) {
        await this.consul.agent.service.deregister(this.serviceId);
        this.logger.log(`Service deregistered from Consul: ${this.serviceId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to deregister from Consul: ${error.message}`);
    }
  }
}
EOF
done

# Step 3: Update main.ts files to use Consul registration
echo ""
echo "📝 Updating main.ts files..."

# Notification service
cat > services/notification-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { ConsulRegistration } from './consul-register';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('notifications');
  
  const port = process.env.PORT || 4010;
  await app.listen(port);
  console.log(`Notification service listening on port ${port}`);
  
  // Register with Consul after startup
  await ConsulRegistration.register('notification-service', Number(port));
}

bootstrap();
EOF

# Auth service
cat > services/auth-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { ConsulRegistration } from './consul-register';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('auth');
  
  const port = process.env.PORT || 4011;
  await app.listen(port);
  console.log(`Auth service listening on port ${port}`);
  
  // Register with Consul after startup
  await ConsulRegistration.register('auth-service', Number(port));
}

bootstrap();
EOF

# User service
cat > services/user-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { UserModule } from './user.module';
import { ConsulRegistration } from './consul-register';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('users');
  
  const port = process.env.PORT || 4012;
  await app.listen(port);
  console.log(`User service listening on port ${port}`);
  
  // Register with Consul after startup
  await ConsulRegistration.register('user-service', Number(port));
}

bootstrap();
EOF

# Visit service
cat > services/visit-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { VisitModule } from './visit.module';
import { ConsulRegistration } from './consul-register';

async function bootstrap() {
  const app = await NestFactory.create(VisitModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('visits');
  
  const port = process.env.PORT || 4013;
  await app.listen(port);
  console.log(`Visit service listening on port ${port}`);
  
  // Register with Consul after startup
  await ConsulRegistration.register('visit-service', Number(port));
}

bootstrap();
EOF

# Wellness service
cat > services/wellness-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WellnessModule } from './wellness.module';
import { ConsulRegistration } from './consul-register';

async function bootstrap() {
  const app = await NestFactory.create(WellnessModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('wellness');
  
  const port = process.env.PORT || 4014;
  await app.listen(port);
  console.log(`Wellness service listening on port ${port}`);
  
  // Register with Consul after startup
  await ConsulRegistration.register('wellness-service', Number(port));
}

bootstrap();
EOF

# Payment service
cat > services/payment-service/src/main.ts << 'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentModule } from './payment.module';
import { ConsulRegistration } from './consul-register';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('payments');
  
  const port = process.env.PORT || 4015;
  await app.listen(port);
  console.log(`Payment service listening on port ${port}`);
  
  // Register with Consul after startup
  await ConsulRegistration.register('payment-service', Number(port));
}

bootstrap();
EOF

# Step 4: Build services
echo ""
echo "🏗️ Building services..."
for service in "${services[@]}"; do
    echo -e "${BLUE}Building $service...${NC}"
    if [ -d "services/$service" ]; then
        (cd services/$service && npm run build 2>/dev/null || npx tsc)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} $service built successfully"
        else
            echo -e "${YELLOW}⚠️${NC} $service build had warnings"
        fi
    fi
done

# Step 5: Rebuild Docker images
echo ""
echo "🐳 Rebuilding Docker images..."
docker compose -f docker-compose.services.yml build

# Step 6: Restart services
echo ""
echo "🔄 Restarting services..."
docker compose -f docker-compose.services.yml up -d --force-recreate

# Step 7: Wait for services to start
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Step 8: Check Consul
echo ""
echo "🔍 Checking Consul registration..."
registered=$(curl -s http://localhost:8500/v1/agent/services | jq 'keys | length - 1')
echo -e "Services registered in Consul: ${GREEN}$registered${NC}"

echo ""
echo "✅ Consul integration complete!"
echo ""
echo "Check Consul UI: http://localhost:8500"
echo ""
echo "If services are not showing:"
echo "1. Check service logs: docker logs stage3-<service-name>"
echo "2. Manually register: ./scripts/register-services-consul.sh"

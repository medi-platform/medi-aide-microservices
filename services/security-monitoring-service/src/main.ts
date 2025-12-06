import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SecurityMonitoringModule } from './security-monitoring.module';

async function bootstrap() {
  const app = await NestFactory.create(SecurityMonitoringModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4041', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Security Monitoring service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Security Monitoring Service', err);
  process.exit(1);
});



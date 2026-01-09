import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CareNetworkModule } from './care-network.module';

async function bootstrap() {
  const app = await NestFactory.create(CareNetworkModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ping', '/'] });
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });
  const port = parseInt(process.env.SERVICE_PORT || '4033', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Care Network service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Care Network Service', err);
  process.exit(1);
});



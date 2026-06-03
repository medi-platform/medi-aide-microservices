import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AdminAnalyticsModule } from './admin-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AdminAnalyticsModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4038', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Admin Analytics service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Admin Analytics Service', err);
  process.exit(1);
});



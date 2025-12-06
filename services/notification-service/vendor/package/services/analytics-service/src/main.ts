import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AnalyticsModule } from './analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('analytics');
  
  const port = process.env.PORT || 4016;
  await app.listen(port);
  console.log(`Analytics service listening on port ${port}`);
}

bootstrap();

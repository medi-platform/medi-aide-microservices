import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WellnessModule } from './wellness.module';

async function bootstrap() {
  const app = await NestFactory.create(WellnessModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const port = process.env.PORT || 4014;
  await app.listen(port);
  console.log(`Wellness service listening on port ${port}`);
}

bootstrap();

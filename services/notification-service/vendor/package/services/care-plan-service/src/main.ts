import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CarePlanModule } from './care-plan.module';

async function bootstrap() {
  const app = await NestFactory.create(CarePlanModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('care-plans');
  
  const port = process.env.PORT || 4019;
  await app.listen(port);
  console.log(`Care Plan service listening on port ${port}`);
}

bootstrap();

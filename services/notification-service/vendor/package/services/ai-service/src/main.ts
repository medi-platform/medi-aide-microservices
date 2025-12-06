import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AIModule } from './ai.module';

async function bootstrap() {
  const app = await NestFactory.create(AIModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('ai');
  
  const port = process.env.PORT || 4018;
  await app.listen(port);
  console.log(`AI service listening on port ${port}`);
}

bootstrap();

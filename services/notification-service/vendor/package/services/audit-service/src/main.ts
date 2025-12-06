import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuditModule } from './audit.module';

async function bootstrap() {
  const app = await NestFactory.create(AuditModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('audit');
  
  const port = process.env.PORT || 4017;
  await app.listen(port);
  console.log(`Audit service listening on port ${port}`);
}

bootstrap();

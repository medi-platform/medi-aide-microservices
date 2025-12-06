import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { VisitModule } from './visit.module';

async function bootstrap() {
  const app = await NestFactory.create(VisitModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const port = process.env.PORT || 4013;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Visit service listening on port ${port}`);
}

bootstrap();

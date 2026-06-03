import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TrainingModule } from './training.module';

async function bootstrap() {
  const app = await NestFactory.create(TrainingModule, { bufferLogs: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Standardize routes behind Kong: /api/v1/*
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ping', '/'] });
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  const port = parseInt(process.env.SERVICE_PORT || '4024', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Training service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Training Service', err);
  process.exit(1);
});

//

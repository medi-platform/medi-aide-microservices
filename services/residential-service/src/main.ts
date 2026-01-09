/**
 * Residential Service Entry Point
 * Main bootstrap for residential care facility microservice
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResidentialModule } from './residential.module';

async function bootstrap() {
  const app = await NestFactory.create(ResidentialModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Residential Service API')
    .setDescription('API for managing residential care facilities (group homes, LTC, assisted living)')
    .setVersion('1.0.0')
    .addTag('Health', 'Health check endpoints')
    .addTag('Residences', 'Facility management')
    .addTag('Resident Assignments', 'Resident placements')
    .addTag('Residential Shifts', 'Shift scheduling and management')
    .addTag('Tasks', 'Task management')
    .addTag('Daily Notes', 'Documentation')
    .addTag('Observations', 'Mood and meal tracking')
    .addTag('Serious Occurrences', 'Ministry-reportable incidents')
    .addTag('Guardians', 'Family/guardian account management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.SERVICE_PORT || 4060;
  await app.listen(port);

  console.log(`🏠 Residential Service running on port ${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();

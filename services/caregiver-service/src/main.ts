/**
 * 🩺 CAREGIVER SERVICE - PROFESSIONAL CAREGIVER MANAGEMENT
 * 
 * Comprehensive caregiver management:
 * - Profile management
 * - Availability and scheduling
 * - Certifications and training
 * - Performance tracking
 * - Document management
 * - Skills and specializations
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CaregiverModule } from './caregiver.module';

async function bootstrap() {
  const logger = new Logger('CaregiverService');
  
  const app = await NestFactory.create(CaregiverModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Caregiver Service API')
      .setDescription('Professional Caregiver Management API')
      .setVersion('1.0.0')
      .addTag('caregivers', 'Caregiver profiles')
      .addTag('availability', 'Availability management')
      .addTag('certifications', 'Certifications and training')
      .addTag('performance', 'Performance tracking')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.SERVICE_PORT || process.env.PORT || 4051;
  await app.listen(port);

  logger.log(`🩺 Caregiver Service running on port ${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();



/**
 * 🏢 AGENCY SERVICE - ENTERPRISE B2B MICROSERVICE
 * 
 * Critical service for home care agency management:
 * - Agency onboarding and registration
 * - Staff management (caregivers, admins)
 * - Service packages and pricing
 * - Billing and invoicing
 * - Compliance and certifications
 * - Training management
 * - Shift scheduling
 * - Analytics and reporting
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AgencyModule } from './agency.module';

async function bootstrap() {
  const logger = new Logger('AgencyService');
  
  const app = await NestFactory.create(AgencyModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
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

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Agency Service API')
      .setDescription('Enterprise B2B Agency Management API')
      .setVersion('1.0.0')
      .addTag('agencies', 'Agency management')
      .addTag('staff', 'Staff management')
      .addTag('caregivers', 'Caregiver affiliations')
      .addTag('billing', 'Billing and invoicing')
      .addTag('compliance', 'Compliance management')
      .addTag('training', 'Training management')
      .addTag('shifts', 'Shift scheduling')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.SERVICE_PORT || process.env.PORT || 4050;
  await app.listen(port);

  logger.log(`🏢 Agency Service running on port ${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();


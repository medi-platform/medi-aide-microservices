import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PatientModule } from './patient.module';

async function bootstrap() {
  const logger = new Logger('PatientService');
  const app = await NestFactory.create(PatientModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*', credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Patient Service API')
      .setDescription('Patient Management API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.SERVICE_PORT || 4052;
  await app.listen(port);
  logger.log(`🏥 Patient Service running on port ${port}`);
}
bootstrap();


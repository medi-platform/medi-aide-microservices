import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CareRequestModule } from './care-request.module';

async function bootstrap() {
  const logger = new Logger('CareRequestService');
  const app = await NestFactory.create(CareRequestModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*', credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Care Request Service API')
      .setDescription('Care Request Workflow API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.SERVICE_PORT || 4053;
  await app.listen(port);
  logger.log(`📋 Care Request Service running on port ${port}`);
}
bootstrap();


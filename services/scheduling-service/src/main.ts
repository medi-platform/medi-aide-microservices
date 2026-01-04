import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SchedulingModule } from './scheduling.module';

async function bootstrap() {
  const logger = new Logger('SchedulingService');
  const app = await NestFactory.create(SchedulingModule);
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ping', '/'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*', credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Scheduling Service API')
      .setDescription('Calendar and Scheduling API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.SERVICE_PORT || 4054;
  await app.listen(port);
  logger.log(`📅 Scheduling Service running on port ${port}`);
}
bootstrap();



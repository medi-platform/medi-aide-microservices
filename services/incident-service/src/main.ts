import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IncidentModule } from './incident.module';

async function bootstrap() {
  const logger = new Logger('IncidentService');
  const app = await NestFactory.create(IncidentModule);
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ping', '/'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*', credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Incident Service API')
      .setDescription('Incident Reporting and Management API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.SERVICE_PORT || 4056;
  await app.listen(port);
  logger.log(`⚠️ Incident Service running on port ${port}`);
}
bootstrap();



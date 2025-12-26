import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IntegrationModule } from './integration.module';

async function bootstrap() {
  const logger = new Logger('IntegrationService');
  const app = await NestFactory.create(IntegrationModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*', credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Integration Service API')
      .setDescription('External Integrations API (AlayaCare, WellSky, UKG)')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.SERVICE_PORT || 4055;
  await app.listen(port);
  logger.log(`🔗 Integration Service running on port ${port}`);
}
bootstrap();


import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { InsuranceModule } from './insurance.module';

async function bootstrap() {
  const logger = new Logger('InsuranceService');
  const app = await NestFactory.create(InsuranceModule);
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ping', '/'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: '*', credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Insurance Service API')
      .setDescription('Insurance and Claims Management API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.SERVICE_PORT || 4057;
  await app.listen(port);
  logger.log(`🏥 Insurance Service running on port ${port}`);
}
bootstrap();



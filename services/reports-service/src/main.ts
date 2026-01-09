import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ReportsModule } from './reports.module';

async function bootstrap() {
  const app = await NestFactory.create(ReportsModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Medi-Aide Reports Service')
    .setDescription('Report generation, scheduling, and distribution service')
    .setVersion('1.0')
    .addTag('Report Definitions', 'Manage report definitions')
    .addTag('Report Executions', 'Generate and manage reports')
    .addTag('Report Schedules', 'Schedule recurring reports')
    .addTag('Report Subscriptions', 'User subscriptions to reports')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 4070);

  await app.listen(port);
  console.log(`Reports Service running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();

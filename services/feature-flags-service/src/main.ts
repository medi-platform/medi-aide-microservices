import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FeatureFlagsModule } from './feature-flags.module';

async function bootstrap() {
  const app = await NestFactory.create(FeatureFlagsModule, { bufferLogs: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Feature Flags Service')
    .setDescription('Enterprise-grade feature flag management API')
    .setVersion('1.0')
    .addTag('Feature Flags')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.SERVICE_PORT || '4042', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Feature Flags service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Feature Flags Service', err);
  process.exit(1);
});


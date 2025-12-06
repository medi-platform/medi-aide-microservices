import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NotificationModule } from './notification.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Get port from env
  const port = process.env.SERVICE_PORT || process.env.PORT || 4010;
  
  await app.listen(port);
  console.log(`Notification service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentModule } from './payment.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const port = process.env.PORT || 4015;
  await app.listen(port);
  console.log(`Payment service listening on port ${port}`);
}

bootstrap();

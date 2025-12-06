import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FraudDetectionModule } from './fraud-detection.module';

async function bootstrap() {
  const app = await NestFactory.create(FraudDetectionModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4040', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Fraud Detection service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Fraud Detection Service', err);
  process.exit(1);
});



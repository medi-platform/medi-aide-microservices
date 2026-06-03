import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FeedbackModule } from './feedback.module';

async function bootstrap() {
  const app = await NestFactory.create(FeedbackModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4025', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Feedback service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Feedback Service', err);
  process.exit(1);
});

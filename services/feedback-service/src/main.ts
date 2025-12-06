import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FeedbackModule } from './feedback.module';

async function bootstrap() {
  const app = await NestFactory.create(FeedbackModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4025', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Feedback service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Feedback Service', err);
  process.exit(1);
});

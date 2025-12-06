import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TrainingModule } from './training.module';

async function bootstrap() {
  const app = await NestFactory.create(TrainingModule, { bufferLogs: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Do not set a global prefix to avoid Kong strip_path issues
  const port = parseInt(process.env.SERVICE_PORT || '4024', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Training service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Training Service', err);
  process.exit(1);
});

//

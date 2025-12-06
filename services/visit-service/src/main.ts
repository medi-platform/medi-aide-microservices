import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { VisitModule } from './visit.module';

async function bootstrap() {
  const app = await NestFactory.create(VisitModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4013', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Visit service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Visit Service', err);
  process.exit(1);
});

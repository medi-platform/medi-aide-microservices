import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CommunicationModule } from './communication.module';

async function bootstrap() {
  const app = await NestFactory.create(CommunicationModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4026', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Communication service listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting Communication Service', err);
  process.exit(1);
});

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ProvincialModule } from './provincial.module';

async function bootstrap() {
  const app = await NestFactory.create(ProvincialModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4034', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Provincial service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Provincial Service', err);
  process.exit(1);
});



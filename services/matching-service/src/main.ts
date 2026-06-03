import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4023', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Matching service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Matching Service', err);
  process.exit(1);
});

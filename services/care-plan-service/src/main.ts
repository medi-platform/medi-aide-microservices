import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CarePlanModule } from './care-plan.module';

async function bootstrap() {
  const app = await NestFactory.create(CarePlanModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.SERVICE_PORT || '4019', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`Care Plan service listening on ${port}`);
}

bootstrap().catch((err) => {

  console.error('Fatal error starting Care Plan Service', err);
  process.exit(1);
});

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { ConsulModule } from './consul.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ConsulModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

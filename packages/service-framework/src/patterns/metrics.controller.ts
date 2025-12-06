import { Controller, Get, Header } from '@nestjs/common';
import * as promClient from 'prom-client';

@Controller('metrics')
export class MetricsController {
  constructor() {
    // Collect default metrics
    promClient.collectDefaultMetrics();
  }

  @Get()
  @Header('Content-Type', promClient.register.contentType)
  getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }
}

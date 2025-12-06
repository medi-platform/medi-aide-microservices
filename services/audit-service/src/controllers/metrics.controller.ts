import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): string {
    const ts = Math.floor(Date.now() / 1000);
    return [
      '# HELP service_info Static service info metric',
      '# TYPE service_info gauge',
      'service_info{service="audit-service",version="1.0.0"} 1',
      '# HELP service_timestamp_seconds Current timestamp',
      '# TYPE service_timestamp_seconds gauge',
      `service_timestamp_seconds ${ts}`,
    ].join('\n') + '\n';
  }
}



import { Body, Controller, Post } from '@nestjs/common';

@Controller('security-monitoring')
export class AlertsController {
  @Post('ingest')
  ingest(@Body() body: any) {
    return { received: true, count: Array.isArray(body?.events) ? body.events.length : 1 };
  }
}



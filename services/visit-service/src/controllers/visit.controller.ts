import { Controller, Get } from '@nestjs/common';

@Controller('visits')
export class VisitController {

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get()
  list() {
    return [];
  }
}

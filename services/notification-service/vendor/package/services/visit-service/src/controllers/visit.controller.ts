import { Controller, Get } from '@nestjs/common';
import { VisitService } from '../services/visit.service';

@Controller('visits')
export class VisitController {
  constructor(private readonly visits: VisitService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get()
  list() {
    return this.visits.list();
  }
}

import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { CarePlanService } from '../services/care-plan.service';

@Controller()
export class CarePlanController {
  constructor(private readonly carePlans: CarePlanService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'care-plan' };
  }

  @Get()
  list() {
    return this.carePlans.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.carePlans.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.carePlans.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.carePlans.update(id, data);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CalendarService } from '../services/calendar.service';

@Controller('calendar')
@ApiTags('calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get('day') @ApiOperation({ summary: 'Get day view' })
  getDayView(@Query('date') date: string, @Query('userId') userId?: string) { return this.service.getDayView(date, userId); }

  @Get('week') @ApiOperation({ summary: 'Get week view' })
  getWeekView(@Query('date') date: string, @Query('userId') userId?: string) { return this.service.getWeekView(date, userId); }

  @Get('month') @ApiOperation({ summary: 'Get month view' })
  getMonthView(@Query('year') year: number, @Query('month') month: number, @Query('userId') userId?: string) { return this.service.getMonthView(year, month, userId); }

  @Get('availability') @ApiOperation({ summary: 'Get availability slots' })
  getAvailability(@Query('caregiverId') caregiverId: string, @Query('date') date: string) { return this.service.getAvailability(caregiverId, date); }
}


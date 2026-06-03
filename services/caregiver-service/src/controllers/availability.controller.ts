import { 
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from '../services/availability.service';

@Controller('caregivers/:caregiverId/availability')
@ApiTags('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Get caregiver availability' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAvailability(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.availabilityService.getAvailability(caregiverId, startDate, endDate);
  }

  @Post()
  @ApiOperation({ summary: 'Set availability' })
  async setAvailability(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: any
  ) {
    return this.availabilityService.setAvailability(caregiverId, dto);
  }

  @Put()
  @ApiOperation({ summary: 'Update availability' })
  async updateAvailability(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: any
  ) {
    return this.availabilityService.updateAvailability(caregiverId, dto);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly recurring availability' })
  async getWeeklyPattern(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.availabilityService.getWeeklyPattern(caregiverId);
  }

  @Put('weekly')
  @ApiOperation({ summary: 'Set weekly recurring availability' })
  async setWeeklyPattern(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: any
  ) {
    return this.availabilityService.setWeeklyPattern(caregiverId, dto);
  }

  @Post('time-off')
  @ApiOperation({ summary: 'Request time off' })
  async requestTimeOff(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: { startDate: string; endDate: string; reason: string }
  ) {
    return this.availabilityService.requestTimeOff(caregiverId, dto);
  }

  @Get('time-off')
  @ApiOperation({ summary: 'Get time off requests' })
  async getTimeOffRequests(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.availabilityService.getTimeOffRequests(caregiverId);
  }

  @Delete('time-off/:requestId')
  @ApiOperation({ summary: 'Cancel time off request' })
  async cancelTimeOff(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string
  ) {
    return this.availabilityService.cancelTimeOff(caregiverId, requestId);
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Check for scheduling conflicts' })
  async checkConflicts(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string
  ) {
    return this.availabilityService.checkConflicts(caregiverId, date, startTime, endTime);
  }
}



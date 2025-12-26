import { Controller, Post, Get, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('gps')
@ApiTags('gps')
export class GpsController {
  @Post('track') @ApiOperation({ summary: 'Record GPS tracking point' })
  track(@Body() dto: { visitId: string; caregiverId: string; latitude: number; longitude: number; accuracy: number }) { return { recorded: true, ...dto }; }

  @Get('visit/:visitId') @ApiOperation({ summary: 'Get visit GPS trail' })
  getVisitTrail(@Param('visitId', ParseUUIDPipe) visitId: string) { return { visitId, trail: [] }; }

  @Get('caregiver/:caregiverId/current') @ApiOperation({ summary: 'Get caregiver current location' })
  getCurrentLocation(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) { return { caregiverId, latitude: 0, longitude: 0, timestamp: new Date() }; }

  @Get('geofence/validate') @ApiOperation({ summary: 'Validate geofence' })
  validateGeofence(@Query('lat') lat: number, @Query('lng') lng: number, @Query('patientId') patientId: string) { return { within: true, distance: 0 }; }
}


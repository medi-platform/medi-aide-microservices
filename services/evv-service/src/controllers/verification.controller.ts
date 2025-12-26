import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('verifications')
@ApiTags('verifications')
export class VerificationController {
  @Get() @ApiOperation({ summary: 'List verifications' })
  findAll(@Query() query: any) { return { items: [], total: 0 }; }

  @Post('clock-in') @ApiOperation({ summary: 'Clock in' })
  clockIn(@Body() dto: { visitId: string; latitude: number; longitude: number; method: string }) { return { id: 'ver-id', type: 'clock-in', verified: true, ...dto }; }

  @Post('clock-out') @ApiOperation({ summary: 'Clock out' })
  clockOut(@Body() dto: { visitId: string; latitude: number; longitude: number; method: string }) { return { id: 'ver-id', type: 'clock-out', verified: true, ...dto }; }

  @Get(':id') @ApiOperation({ summary: 'Get verification' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return { id }; }

  @Post('validate-location') @ApiOperation({ summary: 'Validate location' })
  validateLocation(@Body() dto: { latitude: number; longitude: number; patientAddress: string }) { return { valid: true, distance: 0.1 }; }

  @Get('visit/:visitId') @ApiOperation({ summary: 'Get visit verifications' })
  getVisitVerifications(@Param('visitId', ParseUUIDPipe) visitId: string) { return { visitId, verifications: [] }; }
}


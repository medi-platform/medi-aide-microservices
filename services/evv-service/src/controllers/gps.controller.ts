import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GpsVerificationService } from '../services/gps-verification.service';
import { GpsCoordinates } from '../interfaces/evv.interface';

class ValidateLocationDto {
  patientId!: string;
  latitude!: number;
  longitude!: number;
  accuracy?: number;
}

class UpsertGeofenceDto {
  name!: string;
  description?: string;
  centerLatitude!: number;
  centerLongitude!: number;
  radiusMeters?: number;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

class GeocodeDto {
  address!: string;
}

@Controller('gps')
@ApiTags('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsVerificationService) {}

  @Post('validate-location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate GPS coordinates against patient geofence' })
  @ApiResponse({ status: 200, description: 'Location validation result' })
  async validateLocation(@Body() dto: ValidateLocationDto) {
    const coordinates: GpsCoordinates = {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      timestamp: new Date(),
    };

    return this.gpsService.validateLocation(dto.patientId, coordinates);
  }

  @Get('geofences/:patientId')
  @ApiOperation({ summary: 'Get geofences for a patient' })
  @ApiResponse({ status: 200, description: 'List of geofences' })
  async getPatientGeofences(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const geofences = await this.gpsService.getPatientGeofences(patientId);
    return { patientId, geofences };
  }

  @Post('geofences/:patientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update patient geofence' })
  @ApiResponse({ status: 201, description: 'Geofence created/updated' })
  async upsertGeofence(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpsertGeofenceDto,
  ) {
    return this.gpsService.upsertGeofence(patientId, dto);
  }

  @Put('geofences/:patientId')
  @ApiOperation({ summary: 'Update patient geofence' })
  @ApiResponse({ status: 200, description: 'Geofence updated' })
  async updateGeofence(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: Partial<UpsertGeofenceDto>,
  ) {
    return this.gpsService.upsertGeofence(patientId, dto);
  }

  @Post('geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Geocode an address to coordinates' })
  @ApiResponse({ status: 200, description: 'Geocoded coordinates' })
  async geocodeAddress(@Body() dto: GeocodeDto) {
    const result = await this.gpsService.geocodeAddress(dto.address);
    return result || { error: 'Geocoding service not configured' };
  }
}
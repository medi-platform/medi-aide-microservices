import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerificationService } from '../services/verification.service';
import { VerificationMethod, VerificationPayload, GpsCoordinates } from '../interfaces/evv.interface';

class ClockInOutDto {
  visitId!: string;
  caregiverId!: string;
  patientId!: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  method?: VerificationMethod;
  deviceId?: string;
  photoUrl?: string;
  signatureUrl?: string;
  notes?: string;
}

/**
 * EVV Controller (Legacy/Parity)
 *
 * Kong routes a number of legacy endpoints (e.g. `/api/v1/clock-in-out`,
 * `/api/v1/evv-configurations`) to `/api/v1/evv/*`.
 *
 * The canonical EVV APIs in this service are under `/verifications`, `/gps`,
 * and `/compliance`. This controller provides a stable `/evv` surface for
 * those legacy routes.
 */
@ApiTags('EVV')
@Controller('evv')
export class EvvController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get EVV configuration / root info (parity endpoint)' })
  getEvvConfig() {
    return {
      enabled: true,
      requireSignature: process.env.EVV_REQUIRE_SIGNATURE !== 'false',
      gracePeriodMinutes: Number(process.env.EVV_GRACE_PERIOD_MINUTES || 15),
      providers: ['gps', 'telephony', 'biometric', 'fob'],
      version: process.env.SERVICE_VERSION || '1.0.0',
    };
  }

  @Put()
  @ApiOperation({ summary: 'Update EVV configuration (parity endpoint)' })
  updateEvvConfig(@Body() body: Record<string, unknown>) {
    // This service reads configuration from environment/config at runtime.
    // For parity we accept the payload and return it, so admin tools don’t fail.
    return { success: true, applied: false, requested: body };
  }

  @Post('clock-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clock-in (parity endpoint)' })
  async clockIn(@Body() dto: ClockInOutDto) {
    const coordinates: GpsCoordinates | undefined =
      dto.latitude != null && dto.longitude != null
        ? {
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracy: dto.accuracy,
            timestamp: new Date(),
          }
        : undefined;

    const payload: VerificationPayload = {
      visitId: dto.visitId,
      caregiverId: dto.caregiverId,
      patientId: dto.patientId,
      method: dto.method || VerificationMethod.GPS,
      coordinates,
      deviceId: dto.deviceId,
      photoUrl: dto.photoUrl,
    };

    return this.verificationService.clockIn(payload);
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clock-out (parity endpoint)' })
  async clockOut(@Body() dto: ClockInOutDto) {
    const coordinates: GpsCoordinates | undefined =
      dto.latitude != null && dto.longitude != null
        ? {
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracy: dto.accuracy,
            timestamp: new Date(),
          }
        : undefined;

    const payload: VerificationPayload = {
      visitId: dto.visitId,
      caregiverId: dto.caregiverId,
      patientId: dto.patientId,
      method: dto.method || VerificationMethod.GPS,
      coordinates,
      deviceId: dto.deviceId,
      photoUrl: dto.photoUrl,
      signatureUrl: dto.signatureUrl,
      notes: dto.notes,
    };

    return this.verificationService.clockOut(payload);
  }

  @Get('verifications')
  @ApiOperation({ summary: 'List verifications for a visit (parity endpoint)' })
  async listVerifications(@Query('visitId') visitId?: string) {
    if (!visitId) {
      return { visitId: undefined, verifications: [] };
    }
    const verifications = await this.verificationService.getVisitVerifications(visitId);
    return { visitId, verifications };
  }
}

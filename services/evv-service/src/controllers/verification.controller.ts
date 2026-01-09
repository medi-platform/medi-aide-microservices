import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VerificationService } from '../services/verification.service';
import { VerificationMethod, VerificationPayload, GpsCoordinates } from '../interfaces/evv.interface';

class ClockInDto {
  visitId!: string;
  caregiverId!: string;
  patientId!: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  method?: VerificationMethod;
  deviceId?: string;
  photoUrl?: string;
}

class ClockOutDto extends ClockInDto {
  signatureUrl?: string;
  notes?: string;
}

class ManualOverrideDto {
  reason!: string;
}

@Controller('verifications')
@ApiTags('verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('clock-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record clock-in verification' })
  @ApiResponse({ status: 201, description: 'Clock-in recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or already clocked in' })
  async clockIn(@Body() dto: ClockInDto) {
    const coordinates: GpsCoordinates | undefined =
      dto.latitude && dto.longitude
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
  @ApiOperation({ summary: 'Record clock-out verification' })
  @ApiResponse({ status: 201, description: 'Clock-out recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or missing clock-in' })
  async clockOut(@Body() dto: ClockOutDto) {
    const coordinates: GpsCoordinates | undefined =
      dto.latitude && dto.longitude
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

  @Get(':id')
  @ApiOperation({ summary: 'Get verification by ID' })
  @ApiResponse({ status: 200, description: 'Verification details' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.verificationService.getById(id);
  }

  @Get('visit/:visitId')
  @ApiOperation({ summary: 'Get all verifications for a visit' })
  @ApiResponse({ status: 200, description: 'List of verifications' })
  async getVisitVerifications(@Param('visitId', ParseUUIDPipe) visitId: string) {
    const verifications = await this.verificationService.getVisitVerifications(visitId);
    return { visitId, verifications };
  }

  @Get('caregiver/:caregiverId')
  @ApiOperation({ summary: 'Get verifications by caregiver for date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCaregiverVerifications(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.verificationService.getCaregiverVerifications(
      caregiverId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Put(':id/override')
  @ApiOperation({ summary: 'Manually override verification status' })
  @ApiResponse({ status: 200, description: 'Verification overridden' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async manualOverride(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManualOverrideDto,
    @Query('userId') userId: string,
  ) {
    return this.verificationService.manualOverride(id, userId, dto.reason);
  }
}
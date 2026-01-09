import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CaregiverRegistrationService } from '../services/caregiver-registration.service';

@ApiTags('Caregiver Registration')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverRegistrationController {
  constructor(private readonly registrationService: CaregiverRegistrationService) {}

  // ===== REGISTRATION PROGRESS =====

  @Post(':caregiverId/registration/initialize')
  @ApiOperation({ summary: 'Initialize registration progress for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Registration progress initialized' })
  async initializeProgress(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() body: { totalSteps?: number },
  ) {
    return this.registrationService.initializeProgress(caregiverId, body.totalSteps);
  }

  @Get(':caregiverId/registration/progress')
  @ApiOperation({ summary: 'Get registration progress for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Registration progress' })
  async getProgress(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.registrationService.getProgress(caregiverId);
  }

  @Put(':caregiverId/registration/progress')
  @ApiOperation({ summary: 'Update registration progress' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateProgress(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() body: { currentStep: number; status?: string; metadata?: Record<string, any> },
  ) {
    return this.registrationService.updateProgress(
      caregiverId,
      body.currentStep,
      body.status,
      body.metadata,
    );
  }

  @Post(':caregiverId/registration/complete')
  @ApiOperation({ summary: 'Complete registration for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Registration completed' })
  async completeRegistration(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.registrationService.completeRegistration(caregiverId);
  }

  @Get('registration/stats')
  @ApiOperation({ summary: 'Get registration statistics' })
  @ApiResponse({ status: 200, description: 'Registration statistics' })
  async getRegistrationStats() {
    return this.registrationService.getRegistrationStats();
  }

  // ===== REGISTRATION SESSIONS =====

  @Post(':caregiverId/registration/sessions')
  @ApiOperation({ summary: 'Create a registration session' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async createSession(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() body: { initialData?: Record<string, any>; expirationHours?: number },
  ) {
    return this.registrationService.createSession(
      caregiverId,
      body.initialData,
      body.expirationHours,
    );
  }

  @Get(':caregiverId/registration/sessions/active')
  @ApiOperation({ summary: 'Get active registration session' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Active session' })
  async getActiveSession(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.registrationService.getActiveSession(caregiverId);
  }

  @Get('registration/sessions/:sessionId')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session details' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.registrationService.getSession(sessionId);
  }

  @Put('registration/sessions/:sessionId')
  @ApiOperation({ summary: 'Update session data' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  async updateSessionData(
    @Param('sessionId') sessionId: string,
    @Body() body: { step: number; data: Record<string, any> },
  ) {
    return this.registrationService.updateSessionData(sessionId, body.step, body.data);
  }

  @Post('registration/sessions/:sessionId/extend')
  @ApiOperation({ summary: 'Extend session expiration' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session extended' })
  async extendSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { additionalHours?: number },
  ) {
    return this.registrationService.extendSession(sessionId, body.additionalHours);
  }

  @Delete('registration/sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  async deleteSession(@Param('sessionId') sessionId: string) {
    await this.registrationService.deleteSession(sessionId);
  }

  @Post('registration/sessions/cleanup')
  @ApiOperation({ summary: 'Cleanup expired sessions' })
  @ApiResponse({ status: 200, description: 'Expired sessions cleaned up' })
  async cleanupExpiredSessions() {
    const count = await this.registrationService.cleanupExpiredSessions();
    return { deletedCount: count };
  }
}

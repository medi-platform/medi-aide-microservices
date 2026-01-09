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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { EmarService } from '../services/emar.service';
import { MedicationStatus } from '../entities/medication.entity';
import { AdministrationStatus, NotGivenReason } from '../entities/medication-administration.entity';

/**
 * e-MAR Controller (Electronic Medication Administration Record)
 * 
 * Phase 5D: Full e-MAR implementation with:
 * - Medication management
 * - Schedule generation
 * - Administration recording
 * - Compliance tracking
 * - Canadian healthcare compliance
 */
@ApiTags('eMAR')
@Controller('emar')
export class EmarEnhancedController {
  constructor(private readonly emarService: EmarService) {}

  // ===== MEDICATIONS =====

  @Post('medications')
  @ApiOperation({ summary: 'Add medication to patient profile' })
  @ApiResponse({ status: 201, description: 'Medication created successfully' })
  async createMedication(@Body() dto: {
    patientId: string;
    medicationName: string;
    genericName?: string;
    din?: string;
    dose: string;
    route: string;
    frequency: string;
    scheduledTimes: string[];
    startDate: Date;
    endDate?: Date;
    prescriberId: string;
    prescriberName: string;
    instructions?: string;
    isPrn?: boolean;
    prnIndication?: string;
    maxDailyDose?: string;
    requiresWitness?: boolean;
  }) {
    return this.emarService.createMedication(dto);
  }

  @Get('medications/:id')
  @ApiOperation({ summary: 'Get medication details' })
  @ApiParam({ name: 'id', description: 'Medication ID' })
  async getMedication(@Param('id', ParseUUIDPipe) id: string) {
    return this.emarService.getMedication(id);
  }

  @Put('medications/:id')
  @ApiOperation({ summary: 'Update medication' })
  @ApiParam({ name: 'id', description: 'Medication ID' })
  async updateMedication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<{
      dose: string;
      route: string;
      frequency: string;
      scheduledTimes: string[];
      endDate: Date;
      instructions: string;
      maxDailyDose: string;
    }>,
  ) {
    return this.emarService.updateMedication(id, dto);
  }

  @Post('medications/:id/discontinue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Discontinue medication' })
  @ApiParam({ name: 'id', description: 'Medication ID' })
  async discontinueMedication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reason: string },
  ) {
    return this.emarService.discontinueMedication(id, dto.reason);
  }

  @Get('patients/:patientId/medications')
  @ApiOperation({ summary: 'Get medication list for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'status', required: false, enum: MedicationStatus })
  async listPatientMedications(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('status') status?: MedicationStatus,
  ) {
    return this.emarService.listPatientMedications(patientId, status);
  }

  @Get('patients/:patientId/medications/active')
  @ApiOperation({ summary: 'Get active medications for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  async getActiveMedications(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.emarService.getActiveMedications(patientId);
  }

  // ===== MEDICATION SCHEDULES =====

  @Post('medications/:medicationId/schedules/generate')
  @ApiOperation({ summary: 'Generate medication schedule for date range' })
  @ApiParam({ name: 'medicationId', description: 'Medication ID' })
  async generateSchedule(
    @Param('medicationId', ParseUUIDPipe) medicationId: string,
    @Body() dto: { startDate: string; endDate: string },
  ) {
    return this.emarService.generateSchedule(
      medicationId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get schedule details' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async getSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.emarService.getSchedule(id);
  }

  @Get('patients/:patientId/schedules')
  @ApiOperation({ summary: 'Get medication schedule for patient on date' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD)' })
  async getMedicationScheduleForDate(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('date') date?: string,
  ) {
    const scheduleDate = date ? new Date(date) : new Date();
    return this.emarService.getMedicationScheduleForDate(patientId, scheduleDate);
  }

  @Get('patients/:patientId/schedules/upcoming')
  @ApiOperation({ summary: 'Get upcoming medication schedules' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours ahead (default 2)' })
  async getUpcomingSchedules(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('hours') hours?: number,
  ) {
    return this.emarService.getUpcomingSchedules(patientId, hours);
  }

  @Get('patients/:patientId/schedules/overdue')
  @ApiOperation({ summary: 'Get overdue medication schedules' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  async getOverdueSchedules(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.emarService.getOverdueSchedules(patientId);
  }

  // ===== MEDICATION ADMINISTRATION =====

  @Post('schedules/:scheduleId/administer')
  @ApiOperation({ summary: 'Record medication administration' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  async recordAdministration(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: {
      administeredById: string;
      administeredByName: string;
      status: AdministrationStatus;
      doseGiven?: string;
      routeUsed?: string;
      site?: string;
      witnessId?: string;
      witnessName?: string;
      notGivenReason?: NotGivenReason;
      notGivenDetails?: string;
      notes?: string;
      vitalsBefore?: any;
      vitalsAfter?: any;
      prnIndication?: string;
    },
  ) {
    return this.emarService.recordAdministration(scheduleId, dto);
  }

  @Get('administrations/:id')
  @ApiOperation({ summary: 'Get administration record details' })
  @ApiParam({ name: 'id', description: 'Administration ID' })
  async getAdministration(@Param('id', ParseUUIDPipe) id: string) {
    return this.emarService.getAdministration(id);
  }

  @Get('patients/:patientId/administrations')
  @ApiOperation({ summary: 'Get administration history for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAdministrationHistory(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.emarService.getAdministrationHistory(
      patientId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('medications/:medicationId/administrations')
  @ApiOperation({ summary: 'Get administration history for medication' })
  @ApiParam({ name: 'medicationId', description: 'Medication ID' })
  async getMedicationAdministrationHistory(
    @Param('medicationId', ParseUUIDPipe) medicationId: string,
  ) {
    return this.emarService.getMedicationAdministrationHistory(medicationId);
  }

  @Post('administrations/:id/prn-effectiveness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record PRN medication effectiveness' })
  @ApiParam({ name: 'id', description: 'Administration ID' })
  async recordPrnEffectiveness(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { effectiveness: string; followupTime: string },
  ) {
    return this.emarService.recordPrnEffectiveness(
      id,
      dto.effectiveness,
      new Date(dto.followupTime),
    );
  }

  // ===== e-MAR DASHBOARD =====

  @Get('patients/:patientId/dashboard')
  @ApiOperation({ summary: 'Get e-MAR dashboard for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD)' })
  async getEmarDashboard(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('date') date?: string,
  ) {
    const dashboardDate = date ? new Date(date) : new Date();
    return this.emarService.getEmarDashboard(patientId, dashboardDate);
  }
}

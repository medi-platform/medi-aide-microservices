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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CaregiverProfileExtendedService } from '../services/caregiver-profile-extended.service';
import { EquipmentStatus } from '../entities';

@ApiTags('Caregiver Profile')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverProfileController {
  constructor(private readonly profileService: CaregiverProfileExtendedService) {}

  // ===== LANGUAGES =====

  @Post(':caregiverId/languages')
  @ApiOperation({ summary: 'Add a language to caregiver profile' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Language added' })
  async addLanguage(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.addLanguage({ ...data, caregiverId });
  }

  @Get(':caregiverId/languages')
  @ApiOperation({ summary: 'List languages for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of languages' })
  async listLanguages(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listCaregiverLanguages(caregiverId);
  }

  @Put('languages/:id')
  @ApiOperation({ summary: 'Update a language' })
  @ApiParam({ name: 'id', description: 'Language UUID' })
  @ApiResponse({ status: 200, description: 'Language updated' })
  async updateLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.profileService.updateLanguage(id, data);
  }

  @Delete('languages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a language' })
  @ApiParam({ name: 'id', description: 'Language UUID' })
  @ApiResponse({ status: 204, description: 'Language deleted' })
  async deleteLanguage(@Param('id', ParseUUIDPipe) id: string) {
    await this.profileService.deleteLanguage(id);
  }

  // ===== WORK ZONES =====

  @Post(':caregiverId/work-zones')
  @ApiOperation({ summary: 'Add a work zone' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Work zone added' })
  async addWorkZone(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.addWorkZone({ ...data, caregiverId });
  }

  @Get(':caregiverId/work-zones')
  @ApiOperation({ summary: 'List work zones for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of work zones' })
  async listWorkZones(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listCaregiverWorkZones(caregiverId);
  }

  @Put('work-zones/:id')
  @ApiOperation({ summary: 'Update a work zone' })
  @ApiParam({ name: 'id', description: 'Work zone UUID' })
  @ApiResponse({ status: 200, description: 'Work zone updated' })
  async updateWorkZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.profileService.updateWorkZone(id, data);
  }

  @Delete('work-zones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a work zone' })
  @ApiParam({ name: 'id', description: 'Work zone UUID' })
  @ApiResponse({ status: 204, description: 'Work zone deleted' })
  async deleteWorkZone(@Param('id', ParseUUIDPipe) id: string) {
    await this.profileService.deleteWorkZone(id);
  }

  // ===== EQUIPMENT =====

  @Post(':caregiverId/equipment')
  @ApiOperation({ summary: 'Assign equipment to a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Equipment assigned' })
  async assignEquipment(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.assignEquipment({ ...data, caregiverId });
  }

  @Get(':caregiverId/equipment')
  @ApiOperation({ summary: 'List equipment for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of equipment' })
  async listEquipment(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listCaregiverEquipment(caregiverId);
  }

  @Put('equipment/:id/status')
  @ApiOperation({ summary: 'Update equipment status' })
  @ApiParam({ name: 'id', description: 'Equipment UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateEquipmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: EquipmentStatus },
  ) {
    return this.profileService.updateEquipmentStatus(id, body.status);
  }

  // ===== EMERGENCY CONTACTS =====

  @Post(':caregiverId/emergency-contacts')
  @ApiOperation({ summary: 'Add an emergency contact' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Emergency contact added' })
  async addEmergencyContact(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.addEmergencyContact({ ...data, caregiverId });
  }

  @Get(':caregiverId/emergency-contacts')
  @ApiOperation({ summary: 'List emergency contacts for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of emergency contacts' })
  async listEmergencyContacts(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listEmergencyContacts(caregiverId);
  }

  @Put('emergency-contacts/:id')
  @ApiOperation({ summary: 'Update an emergency contact' })
  @ApiParam({ name: 'id', description: 'Emergency contact UUID' })
  @ApiResponse({ status: 200, description: 'Emergency contact updated' })
  async updateEmergencyContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.profileService.updateEmergencyContact(id, data);
  }

  @Delete('emergency-contacts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an emergency contact' })
  @ApiParam({ name: 'id', description: 'Emergency contact UUID' })
  @ApiResponse({ status: 204, description: 'Emergency contact deleted' })
  async deleteEmergencyContact(@Param('id', ParseUUIDPipe) id: string) {
    await this.profileService.deleteEmergencyContact(id);
  }

  // ===== NOTIFICATION PREFERENCES =====

  @Get(':caregiverId/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Notification preferences' })
  async getNotificationPreferences(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.getNotificationPreferences(caregiverId);
  }

  @Put(':caregiverId/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updateNotificationPreferences(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.updateNotificationPreferences(caregiverId, data);
  }

  // ===== FEEDBACK =====

  @Post(':caregiverId/feedback')
  @ApiOperation({ summary: 'Submit feedback for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Feedback submitted' })
  async submitFeedback(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.submitFeedback({ ...data, caregiverId });
  }

  @Get(':caregiverId/feedback')
  @ApiOperation({ summary: 'List feedback for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of feedback' })
  async listFeedback(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listCaregiverFeedback(caregiverId);
  }

  @Get(':caregiverId/feedback/rating')
  @ApiOperation({ summary: 'Get average rating for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Average rating' })
  async getAverageRating(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    const rating = await this.profileService.getCaregiverAverageRating(caregiverId);
    return { averageRating: rating };
  }

  @Post('feedback/:id/respond')
  @ApiOperation({ summary: 'Respond to feedback' })
  @ApiParam({ name: 'id', description: 'Feedback UUID' })
  @ApiResponse({ status: 200, description: 'Response submitted' })
  async respondToFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { response: string },
  ) {
    return this.profileService.respondToFeedback(id, body.response);
  }

  // ===== PATIENTS =====

  @Post(':caregiverId/patients')
  @ApiOperation({ summary: 'Assign a patient to a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Patient assigned' })
  async assignPatient(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.assignPatient({ ...data, caregiverId });
  }

  @Get(':caregiverId/patients')
  @ApiOperation({ summary: 'List all patients for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  async listPatients(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listCaregiverPatients(caregiverId);
  }

  @Get(':caregiverId/patients/active')
  @ApiOperation({ summary: 'List active patients for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of active patients' })
  async listActivePatients(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listActivePatients(caregiverId);
  }

  @Post('patient-assignments/:id/end')
  @ApiOperation({ summary: 'End a patient relationship' })
  @ApiParam({ name: 'id', description: 'Patient relationship UUID' })
  @ApiResponse({ status: 200, description: 'Relationship ended' })
  async endPatientRelationship(@Param('id', ParseUUIDPipe) id: string) {
    return this.profileService.endPatientRelationship(id);
  }

  // ===== REFERENCES =====

  @Post(':caregiverId/references')
  @ApiOperation({ summary: 'Add a reference for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Reference added' })
  async addReference(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.profileService.addReference({ ...data, caregiverId });
  }

  @Get(':caregiverId/references')
  @ApiOperation({ summary: 'List references for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of references' })
  async listReferences(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.profileService.listCaregiverReferences(caregiverId);
  }

  @Put('references/:id/status')
  @ApiOperation({ summary: 'Update reference status' })
  @ApiParam({ name: 'id', description: 'Reference UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateReferenceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; feedback?: string },
  ) {
    return this.profileService.updateReferenceStatus(id, body.status, body.feedback);
  }
}

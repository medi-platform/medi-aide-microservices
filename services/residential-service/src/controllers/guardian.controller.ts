/**
 * Guardian Controller
 * REST API endpoints for guardian/family account management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  GuardianService,
  CreateGuardianAccountDto,
  UpdateGuardianAccountDto,
  SendNotificationDto,
} from '../services/guardian.service';

@ApiTags('Guardians')
@Controller('guardians')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post()
  @ApiOperation({ summary: 'Create guardian account' })
  @ApiResponse({ status: 201, description: 'Guardian account created' })
  async createGuardianAccount(@Body() dto: CreateGuardianAccountDto) {
    return this.guardianService.createGuardianAccount(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get guardian account by ID' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Guardian account details' })
  async findGuardianById(@Param('id') id: string) {
    return this.guardianService.findGuardianById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update guardian account' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Guardian account updated' })
  async updateGuardianAccount(@Param('id') id: string, @Body() dto: UpdateGuardianAccountDto) {
    return this.guardianService.updateGuardianAccount(id, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate guardian account' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Account activated' })
  async activateAccount(@Param('id') id: string) {
    return this.guardianService.activateAccount(id);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify guardian identity' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Identity verified' })
  async verifyIdentity(@Param('id') id: string, @Body() body: { verifiedBy: string }) {
    return this.guardianService.verifyIdentity(id, body.verifiedBy);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend guardian account' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Account suspended' })
  async suspendAccount(
    @Param('id') id: string,
    @Body() body: { reason: string; suspendedBy: string },
  ) {
    return this.guardianService.suspendAccount(id, body.reason, body.suspendedBy);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke guardian account' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Account revoked' })
  async revokeAccount(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.guardianService.revokeAccount(id, body.reason);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate suspended guardian account' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Account reactivated' })
  async reactivateAccount(@Param('id') id: string) {
    return this.guardianService.reactivateAccount(id);
  }

  @Post(':id/legal-document')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add legal document' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Legal document added' })
  async addLegalDocument(
    @Param('id') id: string,
    @Body() body: { documentType: string; fileId: string; expiresAt?: Date },
  ) {
    return this.guardianService.addLegalDocument(
      id,
      body.documentType,
      body.fileId,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Post(':id/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record guardian login' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiResponse({ status: 200, description: 'Login recorded' })
  async recordLogin(@Param('id') id: string) {
    return this.guardianService.recordLogin(id);
  }

  @Get('resident/:residentId')
  @ApiOperation({ summary: 'List guardians for a resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'List of guardians' })
  async listByResident(@Param('residentId') residentId: string) {
    return this.guardianService.listByResident(residentId);
  }

  @Get('residence/:residenceId')
  @ApiOperation({ summary: 'List all guardians for a residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'List of guardians' })
  async listByResidence(@Param('residenceId') residenceId: string) {
    return this.guardianService.listByResidence(residenceId);
  }

  @Get('resident/:residentId/primary')
  @ApiOperation({ summary: 'Get primary guardian for resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'Primary guardian or null' })
  async getPrimaryGuardian(@Param('residentId') residentId: string) {
    return this.guardianService.getPrimaryGuardian(residentId);
  }

  // Notification Endpoints
  @Post('notifications')
  @ApiOperation({ summary: 'Send notification to guardian' })
  @ApiResponse({ status: 201, description: 'Notification sent' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.guardianService.sendNotification(dto);
  }

  @Post('notifications/:id/delivered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as delivered' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Marked as delivered' })
  async markDelivered(@Param('id') id: string) {
    return this.guardianService.markNotificationDelivered(id);
  }

  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  async markRead(@Param('id') id: string) {
    return this.guardianService.markNotificationRead(id);
  }

  @Get(':id/notifications')
  @ApiOperation({ summary: 'Get notification history for guardian' })
  @ApiParam({ name: 'id', description: 'Guardian Account ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notification history' })
  async getNotificationHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.guardianService.getNotificationHistory(id, limit);
  }
}

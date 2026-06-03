import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EventIngestionService } from '../services/event-ingestion.service';
import { ThreatDetectionService } from '../services/threat-detection.service';
import { AlertService } from '../services/alert.service';
import { AuditService } from '../services/audit.service';
import {
  SecurityEventPayload,
  SecurityEventType,
  SecuritySeverity,
  AlertStatus,
  AlertPriority,
  AuditLogEntry,
  ThreatIndicatorType,
} from '../interfaces/security.interface';

/**
 * Security Monitoring Controller
 * Enterprise-grade security event monitoring and alerting API
 */
@ApiTags('Security Monitoring')
@Controller('security-monitoring')
export class AlertsController {
  constructor(
    private readonly eventIngestion: EventIngestionService,
    private readonly threatDetection: ThreatDetectionService,
    private readonly alertService: AlertService,
    private readonly auditService: AuditService,
  ) {}

  // ==================== Event Ingestion Endpoints ====================

  @Post('events')
  @ApiOperation({ summary: 'Ingest a security event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Event ingested' })
  async ingestEvent(@Body() payload: SecurityEventPayload) {
    return this.eventIngestion.ingestEvent(payload);
  }

  @Post('events/batch')
  @ApiOperation({ summary: 'Ingest multiple security events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch ingestion result' })
  async ingestBatch(@Body() data: { events: SecurityEventPayload[] }) {
    return this.eventIngestion.ingestBatch(data.events);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get security events with filters' })
  @ApiQuery({ name: 'eventType', required: false, enum: SecurityEventType })
  @ApiQuery({ name: 'severity', required: false, enum: SecuritySeverity })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Security events' })
  async getEvents(
    @Query('eventType') eventType?: SecurityEventType,
    @Query('severity') severity?: SecuritySeverity,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.eventIngestion.getEvents({
      eventType,
      severity,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('events/statistics')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event statistics' })
  async getEventStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.eventIngestion.getStatistics(new Date(startDate), new Date(endDate));
  }

  // ==================== Alert Endpoints ====================

  @Get('alerts')
  @ApiOperation({ summary: 'Get security alerts with filters' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiQuery({ name: 'severity', required: false, enum: SecuritySeverity })
  @ApiQuery({ name: 'priority', required: false, enum: AlertPriority })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Security alerts' })
  async getAlerts(
    @Query('status') status?: AlertStatus,
    @Query('severity') severity?: SecuritySeverity,
    @Query('priority') priority?: AlertPriority,
    @Query('assignedTo') assignedTo?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.alertService.getAlerts({
      status,
      severity,
      priority,
      assignedTo,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alert details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Alert not found' })
  async getAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertService.getAlert(id);
  }

  @Put('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('acknowledgedBy') acknowledgedBy: string,
  ) {
    return this.alertService.acknowledgeAlert(id, acknowledgedBy);
  }

  @Put('alerts/:id/assign')
  @ApiOperation({ summary: 'Assign alert to investigator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alert assigned' })
  async assignAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignedTo') assignedTo: string,
  ) {
    return this.alertService.assignAlert(id, assignedTo);
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alert resolved' })
  async resolveAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { resolvedBy: string; resolution: string; isFalsePositive: boolean },
  ) {
    return this.alertService.resolveAlert(id, data.resolvedBy, data.resolution, data.isFalsePositive);
  }

  @Put('alerts/:id/escalate')
  @ApiOperation({ summary: 'Escalate an alert' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alert escalated' })
  async escalateAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.alertService.escalateAlert(id, reason);
  }

  @Post('alerts/:id/notes')
  @ApiOperation({ summary: 'Add note to alert' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note added' })
  async addAlertNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { authorId: string; content: string },
  ) {
    return this.alertService.addNote(id, data.authorId, data.content);
  }

  @Get('alerts/statistics')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alert statistics' })
  async getAlertStatistics() {
    return this.alertService.getStatistics();
  }

  // ==================== Threat Intelligence Endpoints ====================

  @Get('threats')
  @ApiOperation({ summary: 'Get threat indicators' })
  @ApiQuery({ name: 'type', required: false, enum: ThreatIndicatorType })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'minConfidence', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Threat indicators' })
  async getThreatIndicators(
    @Query('type') type?: ThreatIndicatorType,
    @Query('source') source?: string,
    @Query('minConfidence') minConfidence?: number,
  ) {
    return this.threatDetection.getIndicators({
      type,
      source,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
    });
  }

  @Post('threats')
  @ApiOperation({ summary: 'Add threat indicator' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Indicator added' })
  async addThreatIndicator(@Body() data: {
    type: ThreatIndicatorType;
    value: string;
    confidence: number;
    source: string;
    description?: string;
    tags?: string[];
    expiresAt?: Date;
  }) {
    return this.threatDetection.addIndicator(data);
  }

  // ==================== Audit Log Endpoints ====================

  @Post('audit')
  @ApiOperation({ summary: 'Log an audit entry' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Audit logged' })
  async logAudit(@Body() entry: AuditLogEntry) {
    return this.auditService.log(entry);
  }

  @Post('audit/batch')
  @ApiOperation({ summary: 'Log multiple audit entries' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch audit result' })
  async logAuditBatch(@Body() data: { entries: AuditLogEntry[] }) {
    const count = await this.auditService.logBatch(data.entries);
    return { logged: count };
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('resource') resource?: string,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.getLogs({
      userId,
      resource,
      resourceId,
      action: action as never,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('audit/resource/:resource/:resourceId')
  @ApiOperation({ summary: 'Get audit trail for a resource' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resource audit trail' })
  async getResourceAuditTrail(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.auditService.getResourceAuditTrail(resource, resourceId);
  }

  @Get('audit/user/:userId')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User activity log' })
  async getUserActivityLog(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getUserActivityLog(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('audit/:id/verify')
  @ApiOperation({ summary: 'Verify audit log integrity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Integrity verification result' })
  async verifyAuditIntegrity(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.verifyIntegrity(id);
  }

  @Get('audit/statistics')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit statistics' })
  async getAuditStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getStatistics(new Date(startDate), new Date(endDate));
  }

  @Post('audit/export')
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Exported audit logs' })
  async exportAuditLogs(@Body() data: {
    startDate: string;
    endDate: string;
    format?: 'json' | 'csv';
  }) {
    return this.auditService.exportLogs({
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      format: data.format,
    });
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterventionService } from '../services/intervention.service';

class CompleteInterventionDto {
  feedback?: string;
}

class DismissInterventionDto {
  reason?: string;
}

@Controller('interventions')
export class InterventionController {
  constructor(private readonly interventionService: InterventionService) {}

  /**
   * Evaluate and trigger interventions for a user
   */
  @Post('evaluate')
  async evaluateInterventions(@Query('userId') userId: string) {
    const result = await this.interventionService.evaluateAndTrigger(userId);

    return {
      success: true,
      triggered: result.triggered,
      interventions: result.interventions.map(i => ({
        id: i.id,
        type: i.type,
        priority: i.priority,
        content: i.content,
        trigger: i.trigger,
        status: i.status,
        createdAt: i.createdAt,
      })),
      alerts: result.alerts.map(a => ({
        id: a.id,
        type: a.alertType,
        severity: a.severity,
        title: a.title,
        message: a.message,
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  }

  /**
   * Get pending interventions for a user
   */
  @Get('pending')
  async getPendingInterventions(@Query('userId') userId: string) {
    const interventions = await this.interventionService.getPendingInterventions(userId);

    return {
      success: true,
      count: interventions.length,
      interventions: interventions.map(i => ({
        id: i.id,
        type: i.type,
        priority: i.priority,
        content: i.content,
        trigger: i.trigger,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  }

  /**
   * Complete an intervention
   */
  @Post(':interventionId/complete')
  @HttpCode(HttpStatus.OK)
  async completeIntervention(
    @Query('userId') userId: string,
    @Param('interventionId') interventionId: string,
    @Body() dto: CompleteInterventionDto,
  ) {
    const intervention = await this.interventionService.completeIntervention(
      userId,
      interventionId,
      dto.feedback,
    );

    return {
      success: true,
      intervention: {
        id: intervention.id,
        type: intervention.type,
        status: intervention.status,
        engagedAt: intervention.engagedAt,
      },
      message: 'Intervention completed successfully',
    };
  }

  /**
   * Dismiss an intervention
   */
  @Post(':interventionId/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismissIntervention(
    @Query('userId') userId: string,
    @Param('interventionId') interventionId: string,
    @Body() dto: DismissInterventionDto,
  ) {
    const intervention = await this.interventionService.dismissIntervention(
      userId,
      interventionId,
      dto.reason,
    );

    return {
      success: true,
      intervention: {
        id: intervention.id,
        type: intervention.type,
        status: intervention.status,
      },
      message: 'Intervention dismissed',
    };
  }

  /**
   * Get active alerts for a user
   */
  @Get('alerts')
  async getActiveAlerts(@Query('userId') userId: string) {
    const alerts = await this.interventionService.getActiveAlerts(userId);

    return {
      success: true,
      count: alerts.length,
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.alertType,
        severity: a.severity,
        title: a.title,
        message: a.message,
        status: a.status,
        data: a.data,
        createdAt: a.createdAt,
      })),
    };
  }

  /**
   * Acknowledge an alert
   */
  @Post('alerts/:alertId/acknowledge')
  @HttpCode(HttpStatus.OK)
  async acknowledgeAlert(
    @Query('userId') userId: string,
    @Param('alertId') alertId: string,
  ) {
    const alert = await this.interventionService.acknowledgeAlert(userId, alertId);

    return {
      success: true,
      alert: {
        id: alert.id,
        status: alert.status,
        acknowledgedAt: alert.acknowledgedAt,
      },
      message: 'Alert acknowledged',
    };
  }

  /**
   * Get intervention statistics
   */
  @Get('stats')
  async getInterventionStats(
    @Query('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.interventionService.getInterventionStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      stats,
    };
  }
}

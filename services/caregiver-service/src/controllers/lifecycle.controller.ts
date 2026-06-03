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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LifecycleService } from '../services/lifecycle.service';
import { CaregiverLifecycleState } from '../types/lifecycle.types';

class TransitionDto {
  targetState!: CaregiverLifecycleState;
  triggeredBy!: string;
  reason!: string;
  metadata?: Record<string, unknown>;
}

class ApprovalDto {
  approvedBy!: string;
  notes?: string;
}

class SuspendDto {
  suspendedBy!: string;
  reason!: string;
}

@ApiTags('Caregiver Lifecycle')
@Controller('caregivers/:caregiverId/lifecycle')
export class LifecycleController {
  constructor(private readonly lifecycleService: LifecycleService) {}

  @Get()
  @ApiOperation({ summary: 'Get caregiver lifecycle state' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  async getLifecycle(@Param('caregiverId') caregiverId: string) {
    return this.lifecycleService.getLifecycle(caregiverId);
  }

  @Post('transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition caregiver to new state' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiBody({ type: TransitionDto })
  async transitionState(
    @Param('caregiverId') caregiverId: string,
    @Body() dto: TransitionDto,
  ) {
    return this.lifecycleService.transitionState(
      caregiverId,
      dto.targetState,
      dto.triggeredBy,
      dto.reason,
      { metadata: dto.metadata },
    );
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate and auto-transition if needed' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  async evaluateAndTransition(@Param('caregiverId') caregiverId: string) {
    const result = await this.lifecycleService.evaluateAndTransition(caregiverId);
    return result || { message: 'No transition needed', currentState: (await this.lifecycleService.getLifecycle(caregiverId)).currentState };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get state transition history' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  async getTransitionHistory(
    @Param('caregiverId') caregiverId: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.lifecycleService.getTransitionHistory(caregiverId, limit);
  }

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve caregiver (admin action)' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiBody({ type: ApprovalDto })
  async approveCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Body() dto: ApprovalDto,
  ) {
    return this.lifecycleService.approveCaregiver(
      caregiverId,
      dto.approvedBy,
      dto.notes,
    );
  }

  @Post('suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiBody({ type: SuspendDto })
  async suspendCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Body() dto: SuspendDto,
  ) {
    return this.lifecycleService.suspendCaregiver(
      caregiverId,
      dto.suspendedBy,
      dto.reason,
    );
  }

  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate suspended caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiBody({ type: SuspendDto })
  async reactivateCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Body() dto: SuspendDto,
  ) {
    return this.lifecycleService.reactivateCaregiver(
      caregiverId,
      dto.suspendedBy,
      dto.reason,
    );
  }

  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiBody({ type: SuspendDto })
  async deactivateCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Body() dto: SuspendDto,
  ) {
    return this.lifecycleService.deactivateCaregiver(
      caregiverId,
      dto.suspendedBy,
      dto.reason,
    );
  }
}

@ApiTags('Caregiver Lifecycle Stats')
@Controller('caregivers/lifecycle')
export class LifecycleStatsController {
  constructor(private readonly lifecycleService: LifecycleService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get lifecycle statistics across all caregivers' })
  async getLifecycleStats() {
    return this.lifecycleService.getLifecycleStats();
  }
}


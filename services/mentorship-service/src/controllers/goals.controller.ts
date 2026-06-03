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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GoalsService } from '../services/goals.service';
import { GoalCategory, GoalStatus, GoalPriority } from '../entities/mentorship-goal.entity';
import { MilestoneType, MilestoneStatus } from '../entities/mentorship-milestone.entity';

/**
 * Goals Controller
 * Phase 5I: Mentorship goals and milestones
 */
@ApiTags('Mentorship Goals')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // Goals
  @Post()
  @ApiOperation({ summary: 'Create mentorship goal' })
  async createGoal(@Body() dto: {
    mentorshipId: string;
    menteeId: string;
    mentorId: string;
    title: string;
    description?: string;
    category: GoalCategory;
    priority?: GoalPriority;
    targetDate?: Date;
    successCriteria?: any[];
    actionItems?: any[];
  }) {
    return this.goalsService.createGoal(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  async getGoal(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.getGoal(id);
  }

  @Get('mentorship/:mentorshipId')
  @ApiOperation({ summary: 'Get mentorship goals' })
  async getMentorshipGoals(@Param('mentorshipId', ParseUUIDPipe) mentorshipId: string) {
    return this.goalsService.getMentorshipGoals(mentorshipId);
  }

  @Get('mentee/:menteeId')
  @ApiOperation({ summary: 'Get mentee goals' })
  @ApiQuery({ name: 'status', required: false, enum: GoalStatus })
  async getMenteeGoals(
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
    @Query('status') status?: GoalStatus,
  ) {
    return this.goalsService.getMenteeGoals(menteeId, status);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  async updateGoalProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { progressPercentage: number },
  ) {
    return this.goalsService.updateGoalProgress(id, dto.progressPercentage);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete goal' })
  async completeGoal(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.completeGoal(id);
  }

  @Put(':id/action-items/:actionItemId')
  @ApiOperation({ summary: 'Update action item' })
  async updateActionItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('actionItemId') actionItemId: string,
    @Body() dto: { isCompleted: boolean },
  ) {
    return this.goalsService.updateActionItem(id, actionItemId, dto.isCompleted);
  }

  // Milestones
  @Post('milestones')
  @ApiOperation({ summary: 'Create milestone' })
  async createMilestone(@Body() dto: {
    mentorshipId: string;
    menteeId: string;
    goalId?: string;
    title: string;
    description?: string;
    milestoneType: MilestoneType;
    order?: number;
    targetDate?: Date;
    requiresVerification?: boolean;
    pointsAwarded?: number;
  }) {
    return this.goalsService.createMilestone(dto);
  }

  @Get('milestones/:id')
  @ApiOperation({ summary: 'Get milestone by ID' })
  async getMilestone(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.getMilestone(id);
  }

  @Get('mentorship/:mentorshipId/milestones')
  @ApiOperation({ summary: 'Get mentorship milestones' })
  async getMentorshipMilestones(@Param('mentorshipId', ParseUUIDPipe) mentorshipId: string) {
    return this.goalsService.getMentorshipMilestones(mentorshipId);
  }

  @Get('mentee/:menteeId/milestones')
  @ApiOperation({ summary: 'Get mentee milestones' })
  @ApiQuery({ name: 'status', required: false, enum: MilestoneStatus })
  async getMenteeMilestones(
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
    @Query('status') status?: MilestoneStatus,
  ) {
    return this.goalsService.getMenteeMilestones(menteeId, status);
  }

  @Post('milestones/:id/achieve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Achieve milestone' })
  async achieveMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { verifiedBy?: string; verificationNotes?: string },
  ) {
    return this.goalsService.achieveMilestone(id, dto.verifiedBy, dto.verificationNotes);
  }

  @Post('milestones/:id/evidence')
  @ApiOperation({ summary: 'Add evidence to milestone' })
  async addEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      type: 'certificate' | 'assessment' | 'observation' | 'document' | 'other';
      description: string;
      url?: string;
    },
  ) {
    return this.goalsService.addEvidence(id, dto);
  }

  @Put('milestones/:id/feedback')
  @ApiOperation({ summary: 'Add feedback to milestone' })
  async addFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { mentorFeedback?: string; menteeReflection?: string },
  ) {
    return this.goalsService.addFeedback(id, dto);
  }
}

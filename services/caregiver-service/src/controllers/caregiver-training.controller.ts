import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
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
import { CaregiverTrainingDevelopmentService } from '../services/caregiver-training-development.service';
import { TrainingStatus, GoalStatus, ReviewCycleStatus } from '../entities';

@ApiTags('Caregiver Training & Development')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverTrainingController {
  constructor(private readonly trainingService: CaregiverTrainingDevelopmentService) {}

  // ===== TRAININGS =====

  @Post(':caregiverId/trainings')
  @ApiOperation({ summary: 'Enroll caregiver in a training course' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Enrolled in training' })
  async enrollInTraining(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.trainingService.enrollInTraining({ ...data, caregiverId });
  }

  @Get(':caregiverId/trainings')
  @ApiOperation({ summary: 'List trainings for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: TrainingStatus })
  @ApiResponse({ status: 200, description: 'List of trainings' })
  async listTrainings(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: TrainingStatus,
  ) {
    return this.trainingService.listCaregiverTrainings(caregiverId, status);
  }

  @Get(':caregiverId/trainings/expired')
  @ApiOperation({ summary: 'List expired trainings for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of expired trainings' })
  async listExpiredTrainings(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.trainingService.listExpiredTrainings(caregiverId);
  }

  @Get('trainings/:id')
  @ApiOperation({ summary: 'Get training details' })
  @ApiParam({ name: 'id', description: 'Training UUID' })
  @ApiResponse({ status: 200, description: 'Training details' })
  async getTraining(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.getTraining(id);
  }

  @Post('trainings/:id/start')
  @ApiOperation({ summary: 'Start a training course' })
  @ApiParam({ name: 'id', description: 'Training UUID' })
  @ApiResponse({ status: 200, description: 'Training started' })
  async startTraining(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.startTraining(id);
  }

  @Put('trainings/:id/progress')
  @ApiOperation({ summary: 'Update training progress' })
  @ApiParam({ name: 'id', description: 'Training UUID' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { progress: number },
  ) {
    return this.trainingService.updateTrainingProgress(id, body.progress);
  }

  @Post('trainings/:id/complete')
  @ApiOperation({ summary: 'Complete a training course' })
  @ApiParam({ name: 'id', description: 'Training UUID' })
  @ApiResponse({ status: 200, description: 'Training completed' })
  async completeTraining(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { score?: number; certificateNumber?: string },
  ) {
    return this.trainingService.completeTraining(id, body.score, body.certificateNumber);
  }

  // ===== GOALS =====

  @Post(':caregiverId/goals')
  @ApiOperation({ summary: 'Create a goal for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Goal created' })
  async createGoal(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.trainingService.createGoal({ ...data, caregiverId });
  }

  @Get(':caregiverId/goals')
  @ApiOperation({ summary: 'List goals for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: GoalStatus })
  @ApiResponse({ status: 200, description: 'List of goals' })
  async listGoals(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: GoalStatus,
  ) {
    return this.trainingService.listCaregiverGoals(caregiverId, status);
  }

  @Get('goals/:id')
  @ApiOperation({ summary: 'Get goal details' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal details' })
  async getGoal(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.getGoal(id);
  }

  @Put('goals/:id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal updated' })
  async updateGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.trainingService.updateGoal(id, data);
  }

  @Put('goals/:id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateGoalProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { progress: number },
  ) {
    return this.trainingService.updateGoalProgress(id, body.progress);
  }

  @Post('goals/:id/complete')
  @ApiOperation({ summary: 'Complete a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal completed' })
  async completeGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string },
  ) {
    return this.trainingService.completeGoal(id, body.notes);
  }

  // ===== REVIEW CYCLES =====

  @Post(':caregiverId/review-cycles')
  @ApiOperation({ summary: 'Schedule a performance review cycle' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Review cycle scheduled' })
  async scheduleReviewCycle(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.trainingService.scheduleReviewCycle({ ...data, caregiverId });
  }

  @Get(':caregiverId/review-cycles')
  @ApiOperation({ summary: 'List review cycles for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewCycleStatus })
  @ApiResponse({ status: 200, description: 'List of review cycles' })
  async listReviewCycles(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: ReviewCycleStatus,
  ) {
    return this.trainingService.listCaregiverReviewCycles(caregiverId, status);
  }

  @Get('review-cycles/:id')
  @ApiOperation({ summary: 'Get review cycle details' })
  @ApiParam({ name: 'id', description: 'Review cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review cycle details' })
  async getReviewCycle(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.getReviewCycle(id);
  }

  @Post('review-cycles/:id/start')
  @ApiOperation({ summary: 'Start a review cycle' })
  @ApiParam({ name: 'id', description: 'Review cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review cycle started' })
  async startReviewCycle(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainingService.startReviewCycle(id);
  }

  @Post('review-cycles/:id/self-assessment')
  @ApiOperation({ summary: 'Submit self-assessment' })
  @ApiParam({ name: 'id', description: 'Review cycle UUID' })
  @ApiResponse({ status: 200, description: 'Self-assessment submitted' })
  async submitSelfAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { assessment: string },
  ) {
    return this.trainingService.submitSelfAssessment(id, body.assessment);
  }

  @Post('review-cycles/:id/manager-assessment')
  @ApiOperation({ summary: 'Submit manager assessment' })
  @ApiParam({ name: 'id', description: 'Review cycle UUID' })
  @ApiResponse({ status: 200, description: 'Manager assessment submitted' })
  async submitManagerAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      assessment: string;
      score: number;
      strengths: string[];
      areasForImprovement: string[];
      developmentPlan?: string;
    },
  ) {
    return this.trainingService.submitManagerAssessment(
      id,
      body.assessment,
      body.score,
      body.strengths,
      body.areasForImprovement,
      body.developmentPlan,
    );
  }

  @Post('review-cycles/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a review' })
  @ApiParam({ name: 'id', description: 'Review cycle UUID' })
  @ApiResponse({ status: 200, description: 'Review acknowledged' })
  async acknowledgeReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { comments?: string },
  ) {
    return this.trainingService.acknowledgeReview(id, body.comments);
  }
}

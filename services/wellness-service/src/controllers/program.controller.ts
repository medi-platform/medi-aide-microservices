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
import { ProgramService } from '../services/program.service';
import { ProgramType, ProgramStatus } from '../entities/wellness-program.entity';
import { ActivityType, ActivityDifficulty } from '../entities/wellness-activity.entity';
import { ChallengeType, ChallengeStatus, ChallengeScope } from '../entities/wellness-challenge.entity';

/**
 * Program Controller
 * Phase 5I: Wellness programs, activities, and challenges
 */
@ApiTags('Wellness Programs')
@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // Programs
  @Post()
  @ApiOperation({ summary: 'Create wellness program' })
  async createProgram(@Body() dto: {
    title: string;
    titleFr?: string;
    description?: string;
    programType: ProgramType;
    createdBy: string;
    agencyId?: string;
    durationDays: number;
    weeklyCommitmentMinutes?: number;
    pointsOnCompletion?: number;
  }) {
    return this.programService.createProgram(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List wellness programs' })
  @ApiQuery({ name: 'programType', required: false, enum: ProgramType })
  @ApiQuery({ name: 'status', required: false, enum: ProgramStatus })
  @ApiQuery({ name: 'agencyId', required: false })
  async listPrograms(
    @Query('programType') programType?: ProgramType,
    @Query('status') status?: ProgramStatus,
    @Query('agencyId') agencyId?: string,
  ) {
    return this.programService.listPrograms(programType, status, agencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program by ID' })
  async getProgram(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.getProgram(id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish program' })
  async publishProgram(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.publishProgram(id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get program activities' })
  async getProgramActivities(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.getProgramActivities(id);
  }

  // Activities
  @Post('activities')
  @ApiOperation({ summary: 'Create activity' })
  async createActivity(@Body() dto: {
    programId?: string;
    phaseId?: string;
    title: string;
    titleFr?: string;
    description?: string;
    activityType: ActivityType;
    difficulty?: ActivityDifficulty;
    order?: number;
    durationMinutes: number;
    content?: any;
    pointsOnCompletion?: number;
  }) {
    return this.programService.createActivity(dto);
  }

  @Get('activities/standalone')
  @ApiOperation({ summary: 'Get standalone activities' })
  @ApiQuery({ name: 'activityType', required: false, enum: ActivityType })
  async getStandaloneActivities(@Query('activityType') activityType?: ActivityType) {
    return this.programService.getStandaloneActivities(activityType);
  }

  @Get('activities/:id')
  @ApiOperation({ summary: 'Get activity by ID' })
  async getActivity(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.getActivity(id);
  }

  // Challenges
  @Post('challenges')
  @ApiOperation({ summary: 'Create wellness challenge' })
  async createChallenge(@Body() dto: {
    title: string;
    titleFr?: string;
    description?: string;
    challengeType: ChallengeType;
    scope?: ChallengeScope;
    createdBy: string;
    agencyId?: string;
    startDate: Date;
    endDate: Date;
    targetValue: number;
    unit: string;
    pointsOnCompletion?: number;
  }) {
    return this.programService.createChallenge(dto);
  }

  @Get('challenges')
  @ApiOperation({ summary: 'List challenges' })
  @ApiQuery({ name: 'status', required: false, enum: ChallengeStatus })
  @ApiQuery({ name: 'challengeType', required: false, enum: ChallengeType })
  @ApiQuery({ name: 'agencyId', required: false })
  async listChallenges(
    @Query('status') status?: ChallengeStatus,
    @Query('challengeType') challengeType?: ChallengeType,
    @Query('agencyId') agencyId?: string,
  ) {
    return this.programService.listChallenges(status, challengeType, agencyId);
  }

  @Get('challenges/active')
  @ApiOperation({ summary: 'Get active challenges' })
  async getActiveChallenges() {
    return this.programService.getActiveChallenges();
  }

  @Get('challenges/:id')
  @ApiOperation({ summary: 'Get challenge by ID' })
  async getChallenge(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.getChallenge(id);
  }

  @Post('challenges/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start challenge' })
  async startChallenge(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.startChallenge(id);
  }

  @Post('challenges/:id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join challenge' })
  async joinChallenge(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.joinChallenge(id);
  }

  @Post('challenges/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete challenge' })
  async completeChallenge(@Param('id', ParseUUIDPipe) id: string) {
    return this.programService.completeChallenge(id);
  }
}

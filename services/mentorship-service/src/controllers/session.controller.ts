import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { SessionService } from '../services/session.service';

class ScheduleSessionDto {
  @IsUUID()
  mentorshipId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number;

  @IsUUID()
  createdBy!: string;

  @IsOptional()
  @IsString()
  meetingProvider?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  agenda?: string;
}

class CompleteSessionDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Mentorship Sessions')
@Controller('mentorship/sessions')
export class MentorshipSessionController {
  constructor(private readonly sessions: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a mentorship session' })
  async schedule(@Body() dto: ScheduleSessionDto) {
    const session = await this.sessions.scheduleSession({
      mentorshipId: dto.mentorshipId,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes,
      createdBy: dto.createdBy,
      meetingProvider: dto.meetingProvider,
      meetingUrl: dto.meetingUrl,
      agenda: dto.agenda,
    });
    return { session };
  }

  @Post(':sessionId/complete')
  @ApiOperation({ summary: 'Complete a mentorship session' })
  async complete(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: CompleteSessionDto,
  ) {
    const session = await this.sessions.completeSession(sessionId, dto.userId, dto.notes);
    return { session };
  }

  @Get(':mentorshipId')
  @ApiOperation({ summary: 'List sessions for a mentorship' })
  async list(
    @Param('mentorshipId', ParseUUIDPipe) mentorshipId: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    const sessions = await this.sessions.listSessions(mentorshipId, userId);
    return { sessions };
  }
}



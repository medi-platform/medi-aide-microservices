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
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { MentorshipService } from '../services/mentorship.service';

class CreateMentorshipRequestDto {
  @IsUUID()
  menteeId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsString()
  preferredMentorLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  availabilityHoursPerWeek?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagePreference?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communicationPreference?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  menteeYearsExperience?: number;
}

class AcceptMatchDto {
  @IsUUID()
  menteeId!: string;
}

class CompleteMentorshipDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Mentorship')
@Controller('mentorship')
export class MentorshipController {
  constructor(private readonly mentorship: MentorshipService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Create a mentorship request and generate matches' })
  async createRequest(@Body() dto: CreateMentorshipRequestDto) {
    return this.mentorship.createRequest(dto.menteeId, {
      goals: dto.goals,
      specializations: dto.specializations,
      preferredMentorLevel: dto.preferredMentorLevel,
      availabilityHoursPerWeek: dto.availabilityHoursPerWeek,
      languagePreference: dto.languagePreference,
      communicationPreference: dto.communicationPreference,
      menteeYearsExperience: dto.menteeYearsExperience,
    });
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get a mentorship request and its matches' })
  async getRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.mentorship.getRequest(id, userId);
  }

  @Post('matches/:matchId/accept')
  @ApiOperation({ summary: 'Accept a suggested mentor match and create mentorship' })
  async acceptMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: AcceptMatchDto,
  ) {
    const mentorship = await this.mentorship.acceptMatch(matchId, dto.menteeId);
    return { mentorship };
  }

  @Get('relationships')
  @ApiOperation({ summary: 'List mentorships for a user' })
  async listMentorships(@Query('userId', ParseUUIDPipe) userId: string) {
    const mentorships = await this.mentorship.listMentorshipsForUser(userId);
    return { mentorships };
  }

  @Post('relationships/:mentorshipId/complete')
  @ApiOperation({ summary: 'Complete a mentorship' })
  async completeMentorship(
    @Param('mentorshipId', ParseUUIDPipe) mentorshipId: string,
    @Body() dto: CompleteMentorshipDto,
  ) {
    const mentorship = await this.mentorship.completeMentorship(mentorshipId, dto.userId, dto.notes);
    return { mentorship };
  }
}



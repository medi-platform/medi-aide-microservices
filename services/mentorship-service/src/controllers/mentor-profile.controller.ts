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
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { MentorLevel } from '../entities/mentor-profile.entity';
import { MentorProfileService } from '../services/mentor-profile.service';

class UpsertMentorProfileDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEnum(MentorLevel)
  mentorLevel?: MentorLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  availabilityHoursPerWeek?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentoringStyles?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('Mentor Profiles')
@Controller('mentorship/mentor-profiles')
export class MentorProfileController {
  constructor(private readonly mentorProfiles: MentorProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a mentor profile' })
  async upsert(@Body() dto: UpsertMentorProfileDto) {
    const profile = await this.mentorProfiles.upsertProfile(dto);
    return { profile };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a mentor profile by userId' })
  async get(@Param('userId', ParseUUIDPipe) userId: string) {
    const profile = await this.mentorProfiles.getByUserId(userId);
    return { profile };
  }

  @Get()
  @ApiOperation({ summary: 'List mentor profiles' })
  async list(
    @Query('mentorLevel') mentorLevel?: MentorLevel,
    @Query('isActive') isActive?: string,
    @Query('specializations') specializations?: string,
    @Query('languages') languages?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.mentorProfiles.listMentors({
      mentorLevel,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      specializations: specializations ? specializations.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      languages: languages ? languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return result;
  }
}



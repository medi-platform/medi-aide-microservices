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
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { GroupCategory } from '../entities/community-group.entity';
import { CoffeeMeetStatus } from '../entities/coffee-meet.entity';
import { GroupService } from '../services/group.service';
import { CoffeeMeetService } from '../services/coffee-meet.service';

class CreateGroupDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GroupCategory)
  category?: GroupCategory;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsUUID()
  createdBy!: string;
}

class JoinLeaveDto {
  @IsUUID()
  userId!: string;
}

class CreateCoffeeMeetDto {
  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes?: number;

  @IsUUID()
  createdBy!: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsString()
  meetingProvider?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(12)
  maxParticipants?: number;
}

@ApiTags('Care Network')
@Controller('care-network')
export class NetworkController {
  constructor(
    private readonly groups: GroupService,
    private readonly coffeeMeets: CoffeeMeetService,
  ) {}

  // Groups
  @Post('groups')
  @ApiOperation({ summary: 'Create a community group' })
  async createGroup(@Body() dto: CreateGroupDto) {
    const group = await this.groups.createGroup(dto);
    return { group };
  }

  @Get('groups')
  @ApiOperation({ summary: 'List community groups' })
  async listGroups(
    @Query('category') category?: GroupCategory,
    @Query('includePrivate') includePrivate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.groups.listGroups({
      category,
      includePrivate: includePrivate === 'true',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get group details' })
  async getGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    const group = await this.groups.getGroup(groupId);
    return { group };
  }

  @Post('groups/:groupId/join')
  @ApiOperation({ summary: 'Join a group' })
  async joinGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: JoinLeaveDto,
  ) {
    const membership = await this.groups.joinGroup(groupId, dto.userId);
    return { membership };
  }

  @Post('groups/:groupId/leave')
  @ApiOperation({ summary: 'Leave a group' })
  async leaveGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: JoinLeaveDto,
  ) {
    await this.groups.leaveGroup(groupId, dto.userId);
    return { success: true };
  }

  @Get('groups/:groupId/members')
  @ApiOperation({ summary: 'List active group members' })
  async listMembers(@Param('groupId', ParseUUIDPipe) groupId: string) {
    const members = await this.groups.listMembers(groupId);
    return { members };
  }

  @Post('groups/:groupId/members/:userId/approve')
  @ApiOperation({ summary: 'Approve a pending member (admin/owner/moderator)' })
  async approveMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('adminUserId', ParseUUIDPipe) adminUserId: string,
  ) {
    const member = await this.groups.approveMember(groupId, adminUserId, userId);
    return { member };
  }

  // CoffeeMeets
  @Post('coffee-meets')
  @ApiOperation({ summary: 'Create a CoffeeMeet' })
  async createCoffeeMeet(@Body() dto: CreateCoffeeMeetDto) {
    return this.coffeeMeets.createMeet({
      topic: dto.topic,
      description: dto.description,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes,
      createdBy: dto.createdBy,
      groupId: dto.groupId,
      meetingProvider: dto.meetingProvider,
      meetingUrl: dto.meetingUrl,
      maxParticipants: dto.maxParticipants,
    });
  }

  @Get('coffee-meets')
  @ApiOperation({ summary: 'List CoffeeMeets (optionally filter by groupId/userId/status)' })
  async listCoffeeMeets(
    @Query('groupId') groupId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: CoffeeMeetStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.coffeeMeets.listMeets({
      groupId,
      userId,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post('coffee-meets/:meetId/join')
  @ApiOperation({ summary: 'Join a CoffeeMeet' })
  async joinCoffeeMeet(
    @Param('meetId', ParseUUIDPipe) meetId: string,
    @Body() dto: JoinLeaveDto,
  ) {
    const participant = await this.coffeeMeets.joinMeet(meetId, dto.userId);
    return { participant };
  }

  @Get('coffee-meets/:meetId/participants')
  @ApiOperation({ summary: 'List CoffeeMeet participants' })
  async listParticipants(@Param('meetId', ParseUUIDPipe) meetId: string) {
    const participants = await this.coffeeMeets.listParticipants(meetId);
    return { participants };
  }
}



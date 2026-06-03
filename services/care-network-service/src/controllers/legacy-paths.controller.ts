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

// NOTE:
// These controllers exist to satisfy Kong route parity for legacy/root paths like:
// - /api/v1/groups
// - /api/v1/coffee-meets
// - /api/v1/coffeemeets (via Kong alias to /coffee-meets)
//
// The canonical Stage 3 API remains under /api/v1/care-network/*.

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

@ApiTags('Groups')
@Controller('groups')
export class LegacyGroupsController {
  constructor(private readonly groups: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Create a community group (legacy/root path)' })
  async createGroup(@Body() dto: CreateGroupDto) {
    const group = await this.groups.createGroup(dto);
    return { group };
  }

  @Get()
  @ApiOperation({ summary: 'List community groups (legacy/root path)' })
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

  @Get(':groupId')
  @ApiOperation({ summary: 'Get group details (legacy/root path)' })
  async getGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    const group = await this.groups.getGroup(groupId);
    return { group };
  }

  @Post(':groupId/join')
  @ApiOperation({ summary: 'Join a group (legacy/root path)' })
  async joinGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: JoinLeaveDto,
  ) {
    const membership = await this.groups.joinGroup(groupId, dto.userId);
    return { membership };
  }

  @Post(':groupId/leave')
  @ApiOperation({ summary: 'Leave a group (legacy/root path)' })
  async leaveGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: JoinLeaveDto,
  ) {
    await this.groups.leaveGroup(groupId, dto.userId);
    return { success: true };
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'List active group members (legacy/root path)' })
  async listMembers(@Param('groupId', ParseUUIDPipe) groupId: string) {
    const members = await this.groups.listMembers(groupId);
    return { members };
  }

  @Post(':groupId/members/:userId/approve')
  @ApiOperation({ summary: 'Approve a pending member (legacy/root path)' })
  async approveMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('adminUserId', ParseUUIDPipe) adminUserId: string,
  ) {
    const member = await this.groups.approveMember(groupId, adminUserId, userId);
    return { member };
  }
}

@ApiTags('Coffee Meets')
@Controller('coffee-meets')
export class LegacyCoffeeMeetsController {
  constructor(private readonly coffeeMeets: CoffeeMeetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a CoffeeMeet (legacy/root path)' })
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

  @Get()
  @ApiOperation({ summary: 'List CoffeeMeets (legacy/root path)' })
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

  @Post(':meetId/join')
  @ApiOperation({ summary: 'Join a CoffeeMeet (legacy/root path)' })
  async joinCoffeeMeet(
    @Param('meetId', ParseUUIDPipe) meetId: string,
    @Body() dto: JoinLeaveDto,
  ) {
    const participant = await this.coffeeMeets.joinMeet(meetId, dto.userId);
    return { participant };
  }

  @Get(':meetId/participants')
  @ApiOperation({ summary: 'List CoffeeMeet participants (legacy/root path)' })
  async listParticipants(@Param('meetId', ParseUUIDPipe) meetId: string) {
    const participants = await this.coffeeMeets.listParticipants(meetId);
    return { participants };
  }
}

@ApiTags('Community')
@Controller('community')
export class LegacyCommunityController {
  @Get('forums')
  @ApiOperation({ summary: 'List community forums (legacy/root path)' })
  listForums() {
    // Stage 3 does not yet model full forum threads; this endpoint exists for parity.
    // It returns a stable schema so clients don’t fail.
    return {
      forums: [],
      categories: [],
      total: 0,
    };
  }
}

@ApiTags('Delegation')
@Controller('delegation')
export class LegacyDelegationController {
  private static store: Array<{
    id: string;
    delegatorUserId: string;
    delegateUserId: string;
    scope: Record<string, unknown>;
    status: 'pending' | 'accepted' | 'rejected' | 'revoked';
    createdAt: string;
    updatedAt: string;
  }> = [];

  @Get()
  @ApiOperation({ summary: 'List delegation requests (legacy/root path)' })
  list(@Query('userId') userId?: string) {
    const items = userId
      ? LegacyDelegationController.store.filter(
          (d) => d.delegatorUserId === userId || d.delegateUserId === userId,
        )
      : LegacyDelegationController.store;
    return { delegations: items, total: items.length };
  }

  @Post()
  @ApiOperation({ summary: 'Create delegation request (legacy/root path)' })
  create(
    @Body()
    body: {
      delegatorUserId: string;
      delegateUserId: string;
      scope?: Record<string, unknown>;
    },
  ) {
    const now = new Date().toISOString();
    const id = `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      delegatorUserId: body.delegatorUserId,
      delegateUserId: body.delegateUserId,
      scope: body.scope || {},
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };
    LegacyDelegationController.store.unshift(record);
    return { success: true, delegation: record };
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept delegation request (legacy/root path)' })
  accept(@Param('id') id: string) {
    const now = new Date().toISOString();
    const idx = LegacyDelegationController.store.findIndex((d) => d.id === id);
    if (idx >= 0) {
      LegacyDelegationController.store[idx] = {
        ...LegacyDelegationController.store[idx],
        status: 'accepted',
        updatedAt: now,
      };
    }
    return { success: true, id, status: 'accepted' };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject delegation request (legacy/root path)' })
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    const now = new Date().toISOString();
    const idx = LegacyDelegationController.store.findIndex((d) => d.id === id);
    if (idx >= 0) {
      LegacyDelegationController.store[idx] = {
        ...LegacyDelegationController.store[idx],
        status: 'rejected',
        updatedAt: now,
        scope: { ...LegacyDelegationController.store[idx].scope, rejectionReason: reason },
      };
    }
    return { success: true, id, status: 'rejected', reason };
  }
}

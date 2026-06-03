import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityGroup, GroupCategory } from '../entities/community-group.entity';
import { GroupMember, GroupMemberRole, GroupMemberStatus } from '../entities/group-member.entity';

export interface CreateGroupInput {
  name: string;
  description?: string;
  category?: GroupCategory;
  isPrivate?: boolean;
  createdBy: string;
}

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    @InjectRepository(CommunityGroup)
    private readonly groupRepo: Repository<CommunityGroup>,
    @InjectRepository(GroupMember)
    private readonly memberRepo: Repository<GroupMember>,
  ) {}

  async createGroup(input: CreateGroupInput): Promise<CommunityGroup> {
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const group = this.groupRepo.create({
      name: input.name.trim(),
      description: input.description,
      category: input.category ?? GroupCategory.GENERAL,
      isPrivate: input.isPrivate ?? false,
      createdBy: input.createdBy,
      memberCount: 1,
    });
    const saved = await this.groupRepo.save(group);

    // Owner membership
    const owner = this.memberRepo.create({
      groupId: saved.id,
      userId: input.createdBy,
      role: GroupMemberRole.OWNER,
      status: GroupMemberStatus.ACTIVE,
      joinedAt: new Date(),
    });
    await this.memberRepo.save(owner);

    this.logger.log(`Group created: ${saved.id}`);
    return saved;
  }

  async listGroups(options?: {
    category?: GroupCategory;
    includePrivate?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: CommunityGroup[]; total: number }> {
    const where: any = {};
    if (options?.category) where.category = options.category;
    if (!options?.includePrivate) where.isPrivate = false;

    const [data, total] = await this.groupRepo.findAndCount({
      where,
      order: { memberCount: 'DESC', updatedAt: 'DESC' },
      take: Math.min(Math.max(options?.limit ?? 25, 1), 100),
      skip: Math.max(options?.offset ?? 0, 0),
    });

    return { data, total };
  }

  async getGroup(groupId: string): Promise<CommunityGroup> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);
    return group;
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const group = await this.getGroup(groupId);

    const existing = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (existing && existing.status === GroupMemberStatus.ACTIVE) {
      throw new ConflictException('Already a member');
    }
    if (existing && existing.status === GroupMemberStatus.BLOCKED) {
      throw new ForbiddenException('You are blocked from this group');
    }

    if (group.isPrivate) {
      // For private groups we create a pending membership
      const pending = existing
        ? Object.assign(existing, { status: GroupMemberStatus.PENDING })
        : this.memberRepo.create({
            groupId,
            userId,
            status: GroupMemberStatus.PENDING,
            role: GroupMemberRole.MEMBER,
          });
      return this.memberRepo.save(pending);
    }

    const member = existing
      ? Object.assign(existing, { status: GroupMemberStatus.ACTIVE, joinedAt: new Date() })
      : this.memberRepo.create({
          groupId,
          userId,
          status: GroupMemberStatus.ACTIVE,
          role: GroupMemberRole.MEMBER,
          joinedAt: new Date(),
        });

    const saved = await this.memberRepo.save(member);

    // Update member count
    group.memberCount += 1;
    await this.groupRepo.save(group);

    return saved;
  }

  async approveMember(groupId: string, adminUserId: string, memberUserId: string): Promise<GroupMember> {
    await this.assertAdmin(groupId, adminUserId);

    const group = await this.getGroup(groupId);
    const member = await this.memberRepo.findOne({ where: { groupId, userId: memberUserId } });
    if (!member) throw new NotFoundException('Membership not found');

    if (member.status !== GroupMemberStatus.PENDING) {
      throw new BadRequestException('Membership is not pending');
    }

    member.status = GroupMemberStatus.ACTIVE;
    member.joinedAt = new Date();
    const saved = await this.memberRepo.save(member);

    group.memberCount += 1;
    await this.groupRepo.save(group);

    return saved;
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.status !== GroupMemberStatus.ACTIVE) return;

    member.status = GroupMemberStatus.REMOVED;
    await this.memberRepo.save(member);

    group.memberCount = Math.max(0, group.memberCount - 1);
    await this.groupRepo.save(group);
  }

  async listMembers(groupId: string): Promise<GroupMember[]> {
    await this.getGroup(groupId);
    return this.memberRepo.find({
      where: { groupId, status: GroupMemberStatus.ACTIVE },
      order: { role: 'ASC', joinedAt: 'ASC' },
      take: 500,
    });
  }

  private async assertAdmin(groupId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.status !== GroupMemberStatus.ACTIVE) {
      throw new ForbiddenException('Not a group member');
    }
    if (![GroupMemberRole.OWNER, GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(member.role)) {
      throw new ForbiddenException('Not authorized');
    }
  }
}



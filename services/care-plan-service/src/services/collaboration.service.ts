import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CareTeamMember,
  TeamMemberRole,
  TeamMemberStatus,
} from '../entities/care-team-member.entity';
import { CarePlanRevision, RevisionType } from '../entities/care-plan-revision.entity';
import { CarePlan } from '../entities/care-plan.entity';

interface AddTeamMemberDto {
  carePlanId: string;
  userId: string;
  role: TeamMemberRole;
  periodStart?: Date;
  periodEnd?: Date;
  permissions?: CareTeamMember['permissions'];
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

interface UpdateTeamMemberDto {
  role?: TeamMemberRole;
  status?: TeamMemberStatus;
  periodEnd?: Date;
  permissions?: Partial<CareTeamMember['permissions']>;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

const DEFAULT_PERMISSIONS: CareTeamMember['permissions'] = {
  canEdit: false,
  canViewAll: true,
  canAddGoals: false,
  canAddActivities: false,
  canInviteMembers: false,
  canApprove: false,
};

const ROLE_PERMISSIONS: Record<TeamMemberRole, CareTeamMember['permissions']> = {
  [TeamMemberRole.PRIMARY_CAREGIVER]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: true,
    canInviteMembers: false,
    canApprove: false,
  },
  [TeamMemberRole.SECONDARY_CAREGIVER]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: false,
    canAddActivities: true,
    canInviteMembers: false,
    canApprove: false,
  },
  [TeamMemberRole.NURSE]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: true,
    canInviteMembers: false,
    canApprove: true,
  },
  [TeamMemberRole.PHYSICIAN]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: true,
    canInviteMembers: true,
    canApprove: true,
  },
  [TeamMemberRole.THERAPIST]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: true,
    canInviteMembers: false,
    canApprove: false,
  },
  [TeamMemberRole.SOCIAL_WORKER]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: true,
    canInviteMembers: false,
    canApprove: false,
  },
  [TeamMemberRole.CARE_COORDINATOR]: {
    canEdit: true,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: true,
    canInviteMembers: true,
    canApprove: true,
  },
  [TeamMemberRole.FAMILY_MEMBER]: {
    canEdit: false,
    canViewAll: false,
    canAddGoals: false,
    canAddActivities: false,
    canInviteMembers: false,
    canApprove: false,
  },
  [TeamMemberRole.PATIENT]: {
    canEdit: false,
    canViewAll: true,
    canAddGoals: true,
    canAddActivities: false,
    canInviteMembers: false,
    canApprove: false,
  },
  [TeamMemberRole.OTHER]: DEFAULT_PERMISSIONS,
};

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(
    @InjectRepository(CareTeamMember)
    private readonly teamMemberRepo: Repository<CareTeamMember>,
    @InjectRepository(CarePlanRevision)
    private readonly revisionRepo: Repository<CarePlanRevision>,
    @InjectRepository(CarePlan)
    private readonly carePlanRepo: Repository<CarePlan>,
  ) {}

  /**
   * Add a team member to a care plan
   */
  async addTeamMember(
    dto: AddTeamMemberDto,
    invitedByUserId: string,
  ): Promise<CareTeamMember> {
    // Check if user is already a team member
    const existing = await this.teamMemberRepo.findOne({
      where: { carePlanId: dto.carePlanId, userId: dto.userId },
    });

    if (existing && existing.status === TeamMemberStatus.ACTIVE) {
      throw new BadRequestException('User is already a team member');
    }

    // Verify inviter has permission
    await this.verifyPermission(dto.carePlanId, invitedByUserId, 'canInviteMembers');

    // Set default permissions based on role
    const rolePermissions = ROLE_PERMISSIONS[dto.role] || DEFAULT_PERMISSIONS;
    const permissions = dto.permissions
      ? { ...rolePermissions, ...dto.permissions }
      : rolePermissions;

    const member = existing
      ? Object.assign(existing, {
          role: dto.role,
          status: TeamMemberStatus.ACTIVE,
          permissions,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail,
          notes: dto.notes,
        })
      : this.teamMemberRepo.create({
          ...dto,
          status: TeamMemberStatus.ACTIVE,
          permissions,
        });

    await this.teamMemberRepo.save(member);

    // Update care plan contributors
    await this.updateContributors(dto.carePlanId);

    // Record revision
    await this.recordRevision(
      dto.carePlanId,
      invitedByUserId,
      RevisionType.TEAM_MEMBER_ADDED,
      `Team member added: ${dto.role}`,
      member.id,
    );

    this.logger.log(`Team member added: ${member.id} to care plan ${dto.carePlanId}`);

    return member;
  }

  /**
   * Get team members for a care plan
   */
  async getTeamMembers(carePlanId: string): Promise<CareTeamMember[]> {
    return this.teamMemberRepo.find({
      where: { carePlanId, status: TeamMemberStatus.ACTIVE },
      order: { role: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get a user's membership for a care plan
   */
  async getMembership(
    carePlanId: string,
    userId: string,
  ): Promise<CareTeamMember | null> {
    return this.teamMemberRepo.findOne({
      where: { carePlanId, userId, status: TeamMemberStatus.ACTIVE },
    });
  }

  /**
   * Update a team member
   */
  async updateTeamMember(
    memberId: string,
    dto: UpdateTeamMemberDto,
    updatedByUserId: string,
  ): Promise<CareTeamMember> {
    const member = await this.teamMemberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Team member ${memberId} not found`);
    }

    // Verify updater has permission
    await this.verifyPermission(member.carePlanId, updatedByUserId, 'canInviteMembers');

    // Apply updates
    if (dto.role !== undefined) member.role = dto.role;
    if (dto.status !== undefined) member.status = dto.status;
    if (dto.periodEnd !== undefined) member.periodEnd = dto.periodEnd;
    if (dto.contactPhone !== undefined) member.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) member.contactEmail = dto.contactEmail;
    if (dto.notes !== undefined) member.notes = dto.notes;

    if (dto.permissions) {
      member.permissions = { ...member.permissions, ...dto.permissions };
    }

    await this.teamMemberRepo.save(member);

    this.logger.log(`Team member updated: ${memberId}`);

    return member;
  }

  /**
   * Remove a team member
   */
  async removeTeamMember(
    memberId: string,
    removedByUserId: string,
  ): Promise<void> {
    const member = await this.teamMemberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Team member ${memberId} not found`);
    }

    // Verify remover has permission
    await this.verifyPermission(member.carePlanId, removedByUserId, 'canInviteMembers');

    member.status = TeamMemberStatus.REMOVED;
    await this.teamMemberRepo.save(member);

    // Update care plan contributors
    await this.updateContributors(member.carePlanId);

    await this.recordRevision(
      member.carePlanId,
      removedByUserId,
      RevisionType.TEAM_MEMBER_REMOVED,
      `Team member removed: ${member.role}`,
      member.id,
    );

    this.logger.log(`Team member removed: ${memberId}`);
  }

  /**
   * Verify a user has a specific permission
   */
  async verifyPermission(
    carePlanId: string,
    userId: string,
    permission: keyof CareTeamMember['permissions'],
  ): Promise<void> {
    const member = await this.getMembership(carePlanId, userId);

    // Check if user is the care plan author (always has full access)
    const carePlan = await this.carePlanRepo.findOne({ where: { id: carePlanId } });
    if (carePlan?.authorId === userId) {
      return;
    }

    if (!member) {
      throw new ForbiddenException('User is not a member of this care plan');
    }

    if (!member.permissions[permission]) {
      throw new ForbiddenException(`User does not have permission: ${permission}`);
    }
  }

  /**
   * Check if a user has a specific permission (non-throwing)
   */
  async hasPermission(
    carePlanId: string,
    userId: string,
    permission: keyof CareTeamMember['permissions'],
  ): Promise<boolean> {
    try {
      await this.verifyPermission(carePlanId, userId, permission);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get revision history
   */
  async getRevisionHistory(
    carePlanId: string,
    options?: {
      limit?: number;
      offset?: number;
      userId?: string;
      type?: RevisionType;
    },
  ): Promise<CarePlanRevision[]> {
    const where: any = { carePlanId };

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.type) {
      where.revisionType = options.type;
    }

    return this.revisionRepo.find({
      where,
      order: { version: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get a specific revision
   */
  async getRevision(revisionId: string): Promise<CarePlanRevision> {
    const revision = await this.revisionRepo.findOne({ where: { id: revisionId } });
    if (!revision) {
      throw new NotFoundException(`Revision ${revisionId} not found`);
    }
    return revision;
  }

  /**
   * Add a comment to the revision history
   */
  async addComment(
    carePlanId: string,
    userId: string,
    comment: string,
  ): Promise<CarePlanRevision> {
    const lastRevision = await this.revisionRepo.findOne({
      where: { carePlanId },
      order: { version: 'DESC' },
    });

    const revision = this.revisionRepo.create({
      carePlanId,
      userId,
      revisionType: RevisionType.COMMENT,
      version: (lastRevision?.version || 0) + 1,
      summary: comment.substring(0, 100),
      comment,
    });

    await this.revisionRepo.save(revision);

    return revision;
  }

  /**
   * Update contributors list on care plan
   */
  private async updateContributors(carePlanId: string): Promise<void> {
    const members = await this.getTeamMembers(carePlanId);
    const contributorIds = members.map(m => m.userId);

    await this.carePlanRepo.update(carePlanId, {
      contributorIds,
    });
  }

  /**
   * Record a revision
   */
  private async recordRevision(
    carePlanId: string,
    userId: string,
    type: RevisionType,
    summary: string,
    relatedEntityId?: string,
  ): Promise<void> {
    const lastRevision = await this.revisionRepo.findOne({
      where: { carePlanId },
      order: { version: 'DESC' },
    });

    const revision = this.revisionRepo.create({
      carePlanId,
      userId,
      revisionType: type,
      version: (lastRevision?.version || 0) + 1,
      summary,
      relatedEntityType: 'TeamMember',
      relatedEntityId,
    });

    await this.revisionRepo.save(revision);
  }
}


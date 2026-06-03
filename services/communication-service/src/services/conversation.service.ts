import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { ConversationType, ParticipantRole } from '../interfaces/communication.interface';

/**
 * Conversation Service
 * Manages chat conversations and participants
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepo: Repository<ConversationParticipant>,
  ) {}

  /**
   * Create a new conversation
   */
  async create(
    type: ConversationType,
    createdBy: string,
    participantIds: string[],
    name?: string,
    patientId?: string,
  ): Promise<Conversation> {
    const conversation = this.conversationRepo.create({
      type,
      createdBy,
      name,
      patientId,
      isActive: true,
    });

    const saved = await this.conversationRepo.save(conversation);

    // Add creator as owner
    await this.addParticipant(saved.id, createdBy, ParticipantRole.OWNER);

    // Add other participants
    for (const userId of participantIds.filter((id) => id !== createdBy)) {
      await this.addParticipant(saved.id, userId, ParticipantRole.MEMBER);
    }

    this.logger.log(`Conversation ${saved.id} created with ${participantIds.length} participants`);
    return saved;
  }

  /**
   * Get conversation by ID
   */
  async getById(id: string, userId?: string): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({ where: { id } });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    // Verify user is participant if userId provided
    if (userId) {
      const isParticipant = await this.isParticipant(id, userId);
      if (!isParticipant) {
        throw new ForbiddenException('Not a participant of this conversation');
      }
    }

    return conversation;
  }

  /**
   * Get or create direct conversation between two users
   */
  async getOrCreateDirect(userId1: string, userId2: string): Promise<Conversation> {
    // Find existing direct conversation
    const existing = await this.conversationRepo
      .createQueryBuilder('c')
      .innerJoin('conversation_participants', 'p1', 'p1.conversationId = c.id AND p1.userId = :userId1', { userId1 })
      .innerJoin('conversation_participants', 'p2', 'p2.conversationId = c.id AND p2.userId = :userId2', { userId2 })
      .where('c.type = :type', { type: ConversationType.DIRECT })
      .andWhere('c.isActive = true')
      .getOne();

    if (existing) {
      return existing;
    }

    // Create new direct conversation
    return this.create(ConversationType.DIRECT, userId1, [userId1, userId2]);
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const participations = await this.participantRepo.find({
      where: { userId, isActive: true },
      select: ['conversationId'],
    });

    const conversationIds = participations.map((p) => p.conversationId);
    if (conversationIds.length === 0) {
      return [];
    }

    return this.conversationRepo.find({
      where: { id: In(conversationIds), isActive: true },
      order: { lastMessageAt: 'DESC' },
    });
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(
    conversationId: string,
    userId: string,
    role: ParticipantRole = ParticipantRole.MEMBER,
  ): Promise<ConversationParticipant> {
    const existing = await this.participantRepo.findOne({
      where: { conversationId, userId },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.leftAt = undefined;
        return this.participantRepo.save(existing);
      }
      return existing;
    }

    const participant = this.participantRepo.create({
      conversationId,
      userId,
      role,
      isActive: true,
    });

    return this.participantRepo.save(participant);
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: { conversationId, userId, isActive: true },
    });

    if (participant) {
      participant.isActive = false;
      participant.leftAt = new Date();
      await this.participantRepo.save(participant);
    }
  }

  /**
   * Get conversation participants
   */
  async getParticipants(conversationId: string): Promise<ConversationParticipant[]> {
    return this.participantRepo.find({
      where: { conversationId, isActive: true },
    });
  }

  /**
   * Check if user is participant
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const count = await this.participantRepo.count({
      where: { conversationId, userId, isActive: true },
    });
    return count > 0;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string, messageId: string): Promise<void> {
    await this.participantRepo.update(
      { conversationId, userId },
      {
        lastReadMessageId: messageId,
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    );
  }

  /**
   * Update unread count
   */
  async incrementUnreadCount(conversationId: string, excludeUserId: string): Promise<void> {
    await this.participantRepo
      .createQueryBuilder()
      .update(ConversationParticipant)
      .set({ unreadCount: () => 'unreadCount + 1' })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('userId != :excludeUserId', { excludeUserId })
      .andWhere('isActive = true')
      .execute();
  }
}

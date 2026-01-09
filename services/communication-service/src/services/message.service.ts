import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import { MessageType, MessageStatus, MessageAttachment } from '../interfaces/communication.interface';
import { ConversationService } from './conversation.service';

/**
 * Message Service
 * Handles sending and retrieving messages
 */
@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  private readonly maxMessageLength: number;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly conversationService: ConversationService,
    private readonly configService: ConfigService,
  ) {
    this.maxMessageLength = this.configService.get<number>('messaging.maxMessageLength', 5000);
  }

  /**
   * Send a message
   */
  async send(
    conversationId: string,
    senderId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    attachments?: MessageAttachment[],
    replyToId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<Message> {
    // Validate sender is participant
    const isParticipant = await this.conversationService.isParticipant(conversationId, senderId);
    if (!isParticipant) {
      throw new BadRequestException('Not a participant of this conversation');
    }

    // Validate content length
    if (content && content.length > this.maxMessageLength) {
      throw new BadRequestException(`Message exceeds maximum length of ${this.maxMessageLength}`);
    }

    // Extract mentions
    const mentionedUserIds = this.extractMentions(content);

    const message = this.messageRepo.create({
      conversationId,
      senderId,
      type,
      content,
      status: MessageStatus.SENT,
      attachments: (attachments || []) as Message['attachments'],
      replyToId,
      metadata,
      mentionedUserIds,
    });

    const saved = await this.messageRepo.save(message);

    // Update conversation
    await this.conversationRepo.update(conversationId, {
      lastMessageId: saved.id,
      lastMessageAt: saved.createdAt,
      messageCount: () => 'messageCount + 1',
    });

    // Increment unread count for other participants
    await this.conversationService.incrementUnreadCount(conversationId, senderId);

    this.logger.log(`Message ${saved.id} sent in conversation ${conversationId}`);
    return saved;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    beforeId?: string,
  ): Promise<Message[]> {
    // Validate user is participant
    await this.conversationService.getById(conversationId, userId);

    const query = this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.isDeleted = false');

    if (beforeId) {
      const beforeMessage = await this.messageRepo.findOne({ where: { id: beforeId } });
      if (beforeMessage) {
        query.andWhere('m.createdAt < :beforeTime', { beforeTime: beforeMessage.createdAt });
      }
    }

    return query
      .orderBy('m.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get message by ID
   */
  async getById(id: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }
    return message;
  }

  /**
   * Edit a message
   */
  async edit(messageId: string, senderId: string, newContent: string): Promise<Message> {
    const message = await this.getById(messageId);

    if (message.senderId !== senderId) {
      throw new BadRequestException('Can only edit your own messages');
    }

    if (message.type !== MessageType.TEXT) {
      throw new BadRequestException('Can only edit text messages');
    }

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();

    return this.messageRepo.save(message);
  }

  /**
   * Delete a message (soft delete)
   */
  async delete(messageId: string, userId: string): Promise<void> {
    const message = await this.getById(messageId);

    if (message.senderId !== userId) {
      throw new BadRequestException('Can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Message deleted]';

    await this.messageRepo.save(message);
  }

  /**
   * Update message status
   */
  async updateStatus(messageId: string, status: MessageStatus): Promise<Message> {
    const message = await this.getById(messageId);
    message.status = status;
    return this.messageRepo.save(message);
  }

  /**
   * Search messages
   */
  async search(
    userId: string,
    query: string,
    conversationId?: string,
    limit: number = 20,
  ): Promise<Message[]> {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .innerJoin('conversation_participants', 'p', 'p.conversationId = m.conversationId')
      .where('p.userId = :userId', { userId })
      .andWhere('p.isActive = true')
      .andWhere('m.isDeleted = false')
      .andWhere('m.content ILIKE :query', { query: `%${query}%` });

    if (conversationId) {
      qb.andWhere('m.conversationId = :conversationId', { conversationId });
    }

    return qb.orderBy('m.createdAt', 'DESC').take(limit).getMany();
  }

  /**
   * Extract user mentions from message content
   */
  private extractMentions(content?: string): string[] {
    if (!content) return [];
    const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]);
    }
    return mentions;
  }
}

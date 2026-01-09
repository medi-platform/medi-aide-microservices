import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageReaction } from '../entities/message-reaction.entity';

@Injectable()
export class ReactionService {
  private readonly logger = new Logger(ReactionService.name);

  constructor(
    @InjectRepository(MessageReaction)
    private readonly reactionRepo: Repository<MessageReaction>,
  ) {}

  async addReaction(
    messageId: string,
    userId: string,
    userName: string,
    reaction: string,
  ): Promise<MessageReaction> {
    // Check if reaction already exists
    const existing = await this.reactionRepo.findOne({
      where: { messageId, userId, reaction },
    });

    if (existing) {
      return existing;
    }

    const newReaction = this.reactionRepo.create({
      messageId,
      userId,
      userName,
      reaction,
    });

    const saved = await this.reactionRepo.save(newReaction);
    this.logger.debug(`Reaction ${reaction} added to message ${messageId} by ${userId}`);

    return saved;
  }

  async removeReaction(
    messageId: string,
    userId: string,
    reaction: string,
  ): Promise<void> {
    await this.reactionRepo.delete({ messageId, userId, reaction });
    this.logger.debug(`Reaction ${reaction} removed from message ${messageId} by ${userId}`);
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    return this.reactionRepo.find({
      where: { messageId },
      order: { createdAt: 'ASC' },
    });
  }

  async getReactionSummary(
    messageId: string,
  ): Promise<{ reaction: string; count: number; users: string[] }[]> {
    const reactions = await this.getMessageReactions(messageId);

    const summary: Record<string, { count: number; users: string[] }> = {};

    for (const r of reactions) {
      if (!summary[r.reaction]) {
        summary[r.reaction] = { count: 0, users: [] };
      }
      summary[r.reaction].count++;
      summary[r.reaction].users.push(r.userName || r.userId);
    }

    return Object.entries(summary).map(([reaction, data]) => ({
      reaction,
      count: data.count,
      users: data.users,
    }));
  }

  async getUserReactions(userId: string): Promise<MessageReaction[]> {
    return this.reactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}

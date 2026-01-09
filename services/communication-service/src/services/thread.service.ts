import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageThread } from '../entities/message-thread.entity';
import { Message } from '../entities/message.entity';

@Injectable()
export class ThreadService {
  private readonly logger = new Logger(ThreadService.name);

  constructor(
    @InjectRepository(MessageThread)
    private readonly threadRepo: Repository<MessageThread>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createThread(
    conversationId: string,
    parentMessageId: string,
  ): Promise<MessageThread> {
    // Check if thread already exists
    const existing = await this.threadRepo.findOne({
      where: { parentMessageId },
    });

    if (existing) {
      return existing;
    }

    const thread = this.threadRepo.create({
      conversationId,
      parentMessageId,
      participantIds: [],
    });

    return this.threadRepo.save(thread);
  }

  async getThread(threadId: string): Promise<MessageThread> {
    const thread = await this.threadRepo.findOne({ where: { id: threadId } });
    if (!thread) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }
    return thread;
  }

  async getThreadByParentMessage(parentMessageId: string): Promise<MessageThread | null> {
    return this.threadRepo.findOne({ where: { parentMessageId } });
  }

  async addReplyToThread(
    threadId: string,
    replyId: string,
    replyBy: string,
    replyPreview: string,
  ): Promise<MessageThread> {
    const thread = await this.getThread(threadId);

    thread.replyCount++;
    thread.lastReplyId = replyId;
    thread.lastReplyAt = new Date();
    thread.lastReplyBy = replyBy;
    thread.lastReplyPreview = replyPreview.substring(0, 255);

    // Add participant if not already in list
    if (!thread.participantIds.includes(replyBy)) {
      thread.participantIds.push(replyBy);
      thread.participantCount = thread.participantIds.length;
    }

    return this.threadRepo.save(thread);
  }

  async getThreadReplies(threadId: string): Promise<Message[]> {
    const thread = await this.getThread(threadId);

    return this.messageRepo.find({
      where: { replyToId: thread.parentMessageId },
      order: { createdAt: 'ASC' },
    });
  }

  async markThreadResolved(threadId: string, resolvedBy: string): Promise<MessageThread> {
    const thread = await this.getThread(threadId);

    thread.isResolved = true;
    thread.resolvedAt = new Date();
    thread.resolvedBy = resolvedBy;

    return this.threadRepo.save(thread);
  }

  async reopenThread(threadId: string): Promise<MessageThread> {
    const thread = await this.getThread(threadId);

    thread.isResolved = false;
    thread.resolvedAt = undefined;
    thread.resolvedBy = undefined;

    return this.threadRepo.save(thread);
  }

  async getConversationThreads(conversationId: string): Promise<MessageThread[]> {
    return this.threadRepo.find({
      where: { conversationId },
      order: { lastReplyAt: 'DESC' },
    });
  }

  async getActiveThreads(conversationId: string): Promise<MessageThread[]> {
    return this.threadRepo.find({
      where: { conversationId, isResolved: false },
      order: { lastReplyAt: 'DESC' },
    });
  }
}

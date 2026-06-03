import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, ILike } from 'typeorm';
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
} from '../entities/support-ticket.entity';
import { SupportTicketMessage, MessageSenderType } from '../entities/support-ticket-message.entity';

export interface CreateTicketDto {
  agency_id: string;
  created_by_id: string;
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  invoice_id?: string;
  tags?: string[];
  attachments?: string[];
}

export interface AddMessageDto {
  ticket_id: string;
  sender_id?: string;
  sender_type: MessageSenderType;
  sender_name?: string;
  content: string;
  is_internal?: boolean;
  attachments?: string[];
}

export interface TicketFilter {
  agency_id?: string;
  status?: SupportTicketStatus | SupportTicketStatus[];
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  assigned_to_id?: string;
  search?: string;
}

/**
 * SupportTicketService
 * 
 * Manages support tickets for agencies.
 */
@Injectable()
export class SupportTicketService {
  private readonly logger = new Logger(SupportTicketService.name);
  private ticketCounter = 1000;

  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportTicketMessage)
    private readonly messageRepo: Repository<SupportTicketMessage>,
  ) {}

  // ===========================================================================
  // Ticket Management
  // ===========================================================================

  async createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
    this.logger.log(`Creating support ticket for agency ${dto.agency_id}`);

    const ticket = this.ticketRepo.create({
      ...dto,
      ticket_number: this.generateTicketNumber(),
      status: SupportTicketStatus.OPEN,
      priority: dto.priority || SupportTicketPriority.MEDIUM,
      category: dto.category || SupportTicketCategory.OTHER,
      tags: dto.tags || [],
      attachments: dto.attachments || [],
    });

    return this.ticketRepo.save(ticket);
  }

  async getTicketById(id: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return ticket;
  }

  async getTicketByNumber(ticketNumber: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { ticket_number: ticketNumber },
      relations: ['messages'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketNumber} not found`);
    }
    return ticket;
  }

  async listTickets(
    filter: TicketFilter,
    page = 1,
    limit = 20,
  ): Promise<{ data: SupportTicket[]; total: number }> {
    const where: FindOptionsWhere<SupportTicket> = {};

    if (filter.agency_id) where.agency_id = filter.agency_id;
    if (filter.priority) where.priority = filter.priority;
    if (filter.category) where.category = filter.category;
    if (filter.assigned_to_id) where.assigned_to_id = filter.assigned_to_id;

    if (filter.status) {
      where.status = Array.isArray(filter.status) ? In(filter.status) : filter.status;
    }

    const [data, total] = await this.ticketRepo.findAndCount({
      where,
      order: {
        priority: 'DESC',
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async updateTicketStatus(
    id: string,
    status: SupportTicketStatus,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicketById(id);

    ticket.status = status;

    if (status === SupportTicketStatus.RESOLVED) {
      ticket.resolved_at = new Date();
    } else if (status === SupportTicketStatus.CLOSED) {
      ticket.closed_at = new Date();
    }

    return this.ticketRepo.save(ticket);
  }

  async assignTicket(id: string, assigneeId: string): Promise<SupportTicket> {
    const ticket = await this.getTicketById(id);
    ticket.assigned_to_id = assigneeId;

    if (ticket.status === SupportTicketStatus.OPEN) {
      ticket.status = SupportTicketStatus.IN_PROGRESS;
    }

    return this.ticketRepo.save(ticket);
  }

  async updatePriority(id: string, priority: SupportTicketPriority): Promise<SupportTicket> {
    const ticket = await this.getTicketById(id);
    ticket.priority = priority;
    return this.ticketRepo.save(ticket);
  }

  async addTags(id: string, tags: string[]): Promise<SupportTicket> {
    const ticket = await this.getTicketById(id);
    ticket.tags = [...new Set([...ticket.tags, ...tags])];
    return this.ticketRepo.save(ticket);
  }

  async submitSatisfactionRating(
    id: string,
    rating: number,
    feedback?: string,
  ): Promise<SupportTicket> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const ticket = await this.getTicketById(id);

    if (ticket.status !== SupportTicketStatus.RESOLVED && ticket.status !== SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Can only rate resolved or closed tickets');
    }

    ticket.satisfaction_rating = rating;
    ticket.satisfaction_feedback = feedback;

    return this.ticketRepo.save(ticket);
  }

  // ===========================================================================
  // Messages
  // ===========================================================================

  async addMessage(dto: AddMessageDto): Promise<SupportTicketMessage> {
    const ticket = await this.getTicketById(dto.ticket_id);

    const message = this.messageRepo.create({
      ...dto,
      attachments: dto.attachments || [],
      is_internal: dto.is_internal || false,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Track first response time
    if (!ticket.first_response_at && dto.sender_type === MessageSenderType.SUPPORT_AGENT) {
      ticket.first_response_at = new Date();
      await this.ticketRepo.save(ticket);
    }

    // Update status if customer responds to waiting ticket
    if (dto.sender_type === MessageSenderType.CUSTOMER && 
        ticket.status === SupportTicketStatus.WAITING_ON_CUSTOMER) {
      ticket.status = SupportTicketStatus.IN_PROGRESS;
      await this.ticketRepo.save(ticket);
    }

    return savedMessage;
  }

  async getMessages(ticketId: string, includeInternal = false): Promise<SupportTicketMessage[]> {
    const where: FindOptionsWhere<SupportTicketMessage> = { ticket_id: ticketId };

    if (!includeInternal) {
      where.is_internal = false;
    }

    return this.messageRepo.find({
      where,
      order: { created_at: 'ASC' },
    });
  }

  async markMessageAsRead(messageId: string): Promise<SupportTicketMessage> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    message.is_read = true;
    message.read_at = new Date();

    return this.messageRepo.save(message);
  }

  // ===========================================================================
  // Analytics
  // ===========================================================================

  async getTicketStats(agencyId: string): Promise<{
    total: number;
    open: number;
    pending: number;
    in_progress: number;
    resolved: number;
    avg_resolution_time_hours?: number;
    avg_first_response_time_hours?: number;
    avg_satisfaction_rating?: number;
  }> {
    const tickets = await this.ticketRepo.find({
      where: { agency_id: agencyId },
    });

    const total = tickets.length;
    const open = tickets.filter(t => t.status === SupportTicketStatus.OPEN).length;
    const pending = tickets.filter(t => t.status === SupportTicketStatus.PENDING).length;
    const in_progress = tickets.filter(t => t.status === SupportTicketStatus.IN_PROGRESS).length;
    const resolved = tickets.filter(t => t.status === SupportTicketStatus.RESOLVED || t.status === SupportTicketStatus.CLOSED).length;

    // Calculate averages
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const ms = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime();
          return sum + ms;
        }, 0) / resolvedTickets.length / (1000 * 60 * 60)
      : undefined;

    const respondedTickets = tickets.filter(t => t.first_response_at);
    const avgFirstResponseTime = respondedTickets.length > 0
      ? respondedTickets.reduce((sum, t) => {
          const ms = new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime();
          return sum + ms;
        }, 0) / respondedTickets.length / (1000 * 60 * 60)
      : undefined;

    const ratedTickets = tickets.filter(t => t.satisfaction_rating);
    const avgSatisfaction = ratedTickets.length > 0
      ? ratedTickets.reduce((sum, t) => sum + t.satisfaction_rating!, 0) / ratedTickets.length
      : undefined;

    return {
      total,
      open,
      pending,
      in_progress,
      resolved,
      avg_resolution_time_hours: avgResolutionTime,
      avg_first_response_time_hours: avgFirstResponseTime,
      avg_satisfaction_rating: avgSatisfaction,
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private generateTicketNumber(): string {
    const prefix = 'TKT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const counter = (this.ticketCounter++).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${counter}`;
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  SupportTicketService,
  CreateTicketDto,
  AddMessageDto,
  TicketFilter,
} from '../services/support-ticket.service';
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
} from '../entities/support-ticket.entity';
import { MessageSenderType } from '../entities/support-ticket-message.entity';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@Controller('support-tickets')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ticket created successfully' })
  async createTicket(@Body() dto: CreateTicketDto) {
    const ticket = await this.supportTicketService.createTicket(dto);
    return {
      success: true,
      data: ticket,
      message: 'Support ticket created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List support tickets with filters' })
  @ApiQuery({ name: 'agency_id', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SupportTicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: SupportTicketPriority })
  @ApiQuery({ name: 'category', required: false, enum: SupportTicketCategory })
  @ApiQuery({ name: 'assigned_to_id', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listTickets(
    @Query('agency_id') agencyId?: string,
    @Query('status') status?: SupportTicketStatus,
    @Query('priority') priority?: SupportTicketPriority,
    @Query('category') category?: SupportTicketCategory,
    @Query('assigned_to_id') assignedToId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const filter: TicketFilter = {
      agency_id: agencyId,
      status,
      priority,
      category,
      assigned_to_id: assignedToId,
    };

    const result = await this.supportTicketService.listTickets(filter, +page, +limit);
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics for an agency' })
  @ApiQuery({ name: 'agency_id', required: true })
  async getStats(@Query('agency_id') agencyId: string) {
    const stats = await this.supportTicketService.getTicketStats(agencyId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket retrieved' })
  async getTicket(@Param('id', ParseUUIDPipe) id: string) {
    const ticket = await this.supportTicketService.getTicketById(id);
    return {
      success: true,
      data: ticket,
    };
  }

  @Get('number/:ticketNumber')
  @ApiOperation({ summary: 'Get ticket by ticket number' })
  @ApiParam({ name: 'ticketNumber', type: String })
  async getTicketByNumber(@Param('ticketNumber') ticketNumber: string) {
    const ticket = await this.supportTicketService.getTicketByNumber(ticketNumber);
    return {
      success: true,
      data: ticket,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiParam({ name: 'id', type: String })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: SupportTicketStatus },
  ) {
    const ticket = await this.supportTicketService.updateTicketStatus(id, body.status);
    return {
      success: true,
      data: ticket,
      message: 'Ticket status updated',
    };
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to an agent' })
  @ApiParam({ name: 'id', type: String })
  async assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { assignee_id: string },
  ) {
    const ticket = await this.supportTicketService.assignTicket(id, body.assignee_id);
    return {
      success: true,
      data: ticket,
      message: 'Ticket assigned successfully',
    };
  }

  @Patch(':id/priority')
  @ApiOperation({ summary: 'Update ticket priority' })
  @ApiParam({ name: 'id', type: String })
  async updatePriority(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { priority: SupportTicketPriority },
  ) {
    const ticket = await this.supportTicketService.updatePriority(id, body.priority);
    return {
      success: true,
      data: ticket,
      message: 'Ticket priority updated',
    };
  }

  @Patch(':id/tags')
  @ApiOperation({ summary: 'Add tags to ticket' })
  @ApiParam({ name: 'id', type: String })
  async addTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { tags: string[] },
  ) {
    const ticket = await this.supportTicketService.addTags(id, body.tags);
    return {
      success: true,
      data: ticket,
    };
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit satisfaction rating' })
  @ApiParam({ name: 'id', type: String })
  async submitRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { rating: number; feedback?: string },
  ) {
    const ticket = await this.supportTicketService.submitSatisfactionRating(
      id,
      body.rating,
      body.feedback,
    );
    return {
      success: true,
      data: ticket,
      message: 'Rating submitted successfully',
    };
  }

  // ===========================================================================
  // Messages
  // ===========================================================================

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a ticket' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'include_internal', required: false, type: Boolean })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('include_internal') includeInternal = false,
  ) {
    const messages = await this.supportTicketService.getMessages(id, includeInternal);
    return {
      success: true,
      data: messages,
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to a ticket' })
  @ApiParam({ name: 'id', type: String })
  async addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      sender_id?: string;
      sender_type: MessageSenderType;
      sender_name?: string;
      content: string;
      is_internal?: boolean;
      attachments?: string[];
    },
  ) {
    const message = await this.supportTicketService.addMessage({
      ticket_id: id,
      ...body,
    });
    return {
      success: true,
      data: message,
      message: 'Message added successfully',
    };
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'messageId', type: String })
  async markMessageAsRead(@Param('messageId', ParseUUIDPipe) messageId: string) {
    const message = await this.supportTicketService.markMessageAsRead(messageId);
    return {
      success: true,
      data: message,
    };
  }
}

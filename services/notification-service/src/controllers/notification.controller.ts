import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../entities/notification.entity';

// Accept requests at root ("/") so Kong with strip_path forwards correctly.
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(['notifications', ''])
  async findAll(): Promise<Notification[]> {
    return this.notificationService.findRecent();
  }

  @Get(['notifications/:id', ':id'])
  async findOne(@Param('id') id: string): Promise<Notification | null> {
    return this.notificationService.findById(id);
  }

  @Post(['notifications', ''])
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: CreateNotificationDto) {
    const result = await this.notificationService.createAndDispatch(dto);
    return { status: 'accepted', id: result.id };
  }
}



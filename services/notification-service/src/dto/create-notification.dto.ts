import { IsEnum, IsISO8601, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @MaxLength(255)
  recipient!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string; // ISO date string
}



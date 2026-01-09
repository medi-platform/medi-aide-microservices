import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Existing Entities
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { UserPresence } from './entities/user-presence.entity';

// Phase 5F: New Entities
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReadReceipt } from './entities/message-read-receipt.entity';
import { PushNotificationToken } from './entities/push-notification-token.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { MessageThread } from './entities/message-thread.entity';
import { ScheduledMessage } from './entities/scheduled-message.entity';
import { MessageTemplate } from './entities/message-template.entity';

// Existing Services
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';

// Phase 5F: New Services
import { ReactionService } from './services/reaction.service';
import { NotificationService } from './services/notification.service';
import { ThreadService } from './services/thread.service';
import { ScheduledMessageService } from './services/scheduled-message.service';
import { TemplateService } from './services/template.service';

// Infrastructure Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

// Existing Controllers
import { ChatController } from './controllers/chat.controller';
import { MessagingController } from './controllers/messaging.controller';

// Phase 5F: New Controllers
import { ReactionController } from './controllers/reaction.controller';
import { NotificationController } from './controllers/notification.controller';
import { ThreadController } from './controllers/thread.controller';
import { ScheduledMessageController } from './controllers/scheduled-message.controller';
import { TemplateController } from './controllers/template.controller';

import { ConsulModule } from './consul.module';

/**
 * Communication Service Module
 * 
 * Phase 5F Enhancement: Communication Service Enhancement
 * 
 * Entities:
 * - Existing: Conversation, ConversationParticipant, Message, UserPresence
 * - New: MessageReaction, MessageReadReceipt, PushNotificationToken, 
 *        NotificationPreference, NotificationLog, MessageThread, 
 *        ScheduledMessage, MessageTemplate
 * 
 * Total: 12 entities (4 existing + 8 new)
 */
const entities = [
  // Existing Entities
  Conversation,
  ConversationParticipant,
  Message,
  UserPresence,
  // Phase 5F: New Entities
  MessageReaction,
  MessageReadReceipt,
  PushNotificationToken,
  NotificationPreference,
  NotificationLog,
  MessageThread,
  ScheduledMessage,
  MessageTemplate,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    TerminusModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        username: configService.get<string>('database.username', 'service_user'),
        password: configService.get<string>('database.password', 'service123'),
        database: configService.get<string>('database.database', 'communication_db') as string,
        entities,
        autoLoadEntities: false,
        synchronize: configService.get('NODE_ENV') === 'development',
        ssl: configService.get<boolean>('database.ssl', false)
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
    ConsulModule,
  ],
  controllers: [
    // Infrastructure Controllers
    HealthController,
    MetricsController,
    PingController,
    // Existing Controllers
    ChatController,
    MessagingController,
    // Phase 5F: New Controllers
    ReactionController,
    NotificationController,
    ThreadController,
    ScheduledMessageController,
    TemplateController,
  ],
  providers: [
    // Existing Services
    ConversationService,
    MessageService,
    // Phase 5F: New Services
    ReactionService,
    NotificationService,
    ThreadService,
    ScheduledMessageService,
    TemplateService,
  ],
  exports: [
    // Existing Services
    ConversationService,
    MessageService,
    // Phase 5F: New Services
    ReactionService,
    NotificationService,
    ThreadService,
    ScheduledMessageService,
    TemplateService,
  ],
})
export class CommunicationModule {}

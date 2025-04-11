import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'src/ormconfig';
import { User } from 'src/user/user.entity';
import { Conversation } from './entities/conversation.entity';
import { UsersModule } from 'src/user/user.module';
import { ConversationsGateway } from './conversations.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { EventsGateway } from 'src/events/events.gateway';
import { FriendsEntity } from '@/friends/entities/friends.entity';
import { ChatGameInvite, UserConversation } from './entities';
import { Chat } from './entities/chat.entity';
// import { ChatGameInvite } from './entities/chat-game-invite.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([
      User,
      Chat,
      Conversation,
      UserConversation,
      FriendsEntity,
	  ChatGameInvite,
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, EventsGateway, ConversationsGateway],
  exports: [ConversationsService, ConversationsGateway],
})
export class ConversationsModule {}

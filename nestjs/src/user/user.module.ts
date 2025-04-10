import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';
import { Match } from '../match/match.entity';
import { typeOrmConfig } from '../ormconfig';
import { Conversation } from 'src/conversations/entities/conversation.entity';
import { Chat } from '@/conversations/entities/chat.entity';
import { UserConversation } from '@/conversations/entities';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Match, Chat, Conversation, UserConversation]),
    MatchModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}

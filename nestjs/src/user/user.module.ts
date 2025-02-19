import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';
import { Match } from '../match/match.entity';
import { typeOrmConfig } from '../ormconfig';
import { AuthModule } from '../auth/auth.module';
import { Chat, Conversation, UserConversation } from 'src/conversations/entities/conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Match, Chat, Conversation, UserConversation]),
    MatchModule,
    // forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}

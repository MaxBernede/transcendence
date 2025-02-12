import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';
import { Match } from '../match/match.entity';
import { AchievementEntity } from '../achievement/achievement.entity';
import { typeOrmConfig } from '../ormconfig';
import { Chat, Conversation, UserConversation } from 'src/conversations/entities/conversation.entity';
import { AchievementModule } from 'src/achievement/achievement.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Match, AchievementEntity, Chat, Conversation, UserConversation]),
    AchievementModule,
    MatchModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}

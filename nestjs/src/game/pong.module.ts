import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { UsersModule } from '@/user/user.module';
import { MatchModule } from '@/match/match.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '@/ormconfig';
import { Chat, ChatGameInvite, Conversation } from '@/conversations/entities';
import { User } from '@/user/user.entity';
import { AuthModule } from '@/auth/auth.module';

@Module({
  providers: [PongGateway, PongService],
//   imports: [UsersModule, MatchModule],
imports: [
	TypeOrmModule.forRoot(typeOrmConfig),
	TypeOrmModule.forFeature([
	  User,
	  Chat,
	  Conversation,
	  ChatGameInvite,
	]),
	UsersModule,
	AuthModule,
	MatchModule,
  ],
  exports: [PongService, PongGateway],
})
export class PongModule {}

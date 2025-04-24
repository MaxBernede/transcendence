import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './ormconfig';
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AppService } from './app.service';
import { PongModule } from './game/pong.module';
import { FriendsModule } from './friends/friends.module';
import { User } from './user/user.entity';
import { EventsGateway } from './events/events.gateway';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // envFilePath: '../.env',
    }),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsersModule,
    TwoFactorAuthModule,
    ConversationsModule,
    PongModule,
    FriendsModule,
    MatchModule,
	PongModule
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}

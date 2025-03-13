import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module'; // ✅ Fixed import
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AppService } from './app.service';
import { PongModule } from './game/pong.module';
import { PongGateway } from './game/pong.gateway';
import { FriendsModule } from './friends/friends.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forRoot(typeOrmConfig),
    // TypeOrmModule.forFeature([User]),
    DatabasesModule,
    // UsersModule,
    AuthModule,
	  UsersModule,
    TwoFactorAuthModule,
    ConversationsModule,
	PongModule,
  ],
  controllers: [AppController],
  providers: [AppService, PongGateway],
})
export class AppModule {}

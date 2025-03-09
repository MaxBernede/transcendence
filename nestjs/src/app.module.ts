import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module'; // ✅ Fixed import
import { UsersModule } from './user/user.module';
import { AchievementModule } from './achievement/achievement.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/user.entity';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AppService } from './app.service';
import { PongGateway } from './game/pong.gateway';
import { PongModule } from './game/pong.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsersModule,
    TwoFactorAuthModule,
    ConversationsModule,
    DatabasesModule, 
    PongModule,
  ],
  controllers: [AppController],
  providers: [AppService, PongGateway],
})
export class AppModule {}

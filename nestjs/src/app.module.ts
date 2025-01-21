import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { AchievementModule } from './achievement/achievement.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
// import { AuthGuard } from './auth/auth.guard';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/user.entity';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    // TypeOrmModule.forFeature([User]),
    DatabasesModule,
    // UsersModule,
    AuthModule,
	UsersModule,
    // AchievementModule,
    TwoFactorAuthModule,
    ConversationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AppService } from './app.service';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    DatabasesModule,
    AuthModule,
	  UsersModule,
    TwoFactorAuthModule,
    ConversationsModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './user/user.controller';
import { DrizzleModule } from './drizzle/drizzle.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { FriendRequestsController } from './friend-requests/friend-requests.controller';
import { FriendRequestsService } from './friend-requests/friend-requests.service';
import { FriendRequestsModule } from './friend-requests/friend-requests.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // make module accessible everywhere to have .env access
      envFilePath: '../.env', //relative path
    }),
	DrizzleModule,
	UserModule,
	FriendRequestsModule
  ],
  controllers: [AppController, UserController, FriendRequestsController],
  providers: [AppService, UserService, FriendRequestsService], // The use of APP_GUARD will protect each endpoint with a JWT
})
export class AppModule {}

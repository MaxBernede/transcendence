import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserController } from './user/user.controller';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // make module accessible everywhere to have .env access
      envFilePath: '../.env', //relative path
    }),
    PrismaModule,
  ],
  controllers: [AppController, UserController],
  providers: [
    AppService,
  ], // The use of APP_GUARD will protect each endpoint with a JWT
})
export class AppModule {}

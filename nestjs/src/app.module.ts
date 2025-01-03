import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { AchievementModule } from './achievement/achievement.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		TypeOrmModule.forRoot(typeOrmConfig),
		DatabasesModule,
		UsersModule,
		AuthModule,
		AchievementModule,
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '../.env' 
		})
	],	
  controllers: [AppController],
  providers: [
	{
		provide: APP_GUARD,
		useClass: AuthGuard,
	},
	AppService
	], // The use of APP_GUARD will protect each endpoint with a JWT
})
export class AppModule {}

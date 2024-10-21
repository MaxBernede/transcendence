import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { AchievementModule } from './achievement/achievement.module';

@Module({
	imports: [
		TypeOrmModule.forRoot(typeOrmConfig),
		DatabasesModule,
		UsersModule,
		AchievementModule,
	],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

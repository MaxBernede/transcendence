import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './ormconfig';
import { DatabasesModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { AchievementModule } from './achievement/achievement.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig), // Database connection is configured globally here
    DatabasesModule,
    UsersModule,
    AchievementModule,
    MatchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

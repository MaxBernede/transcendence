import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';
import { Match } from '../match/match.entity';
import { AchievementEntity } from '../achievement/achievement.entity';
import { typeOrmConfig } from '../ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Match, AchievementEntity]), // Import User entity
    MatchModule, // Import MatchModule if necessary
  ],
  controllers: [UserController],
  providers: [UserService], // Provide UserService
  exports: [UserService], // Export UserService for other modules
})
export class UsersModule {}
	
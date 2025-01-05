import { Module ,forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';
import { Match } from '../match/match.entity';
import { AchievementEntity } from '../achievement/achievement.entity';
import { typeOrmConfig } from '../ormconfig';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Match, AchievementEntity]), 
    MatchModule, 
    forwardRef(() => AuthModule), 
  ],
  controllers: [UserController],
  providers: [UserService], 
  exports: [UserService], 
})
export class UsersModule {}
	
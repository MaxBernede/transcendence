import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AchievementService,
  UserAchievementService,
} from './achievement.service';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AchievementEntity, UserAchievementEntity]),
  ],
  providers: [AchievementService, UserAchievementService],
  exports: [AchievementService, UserAchievementService],
})
export class AchievementModule {}

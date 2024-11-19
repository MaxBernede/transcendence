import { Module } from '@nestjs/common';
import { AchievementController, UserAchievementController } from './achievement.controller';
import { AchievementService, UserAchievementService } from './achievement.service';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AchievementEntity, UserAchievementEntity]), // Only feature entities here
  ],
  controllers: [AchievementController, UserAchievementController],
  providers: [AchievementService, UserAchievementService],
  exports: [AchievementService, UserAchievementService], // Export if other modules use the services
})
export class AchievementModule {}

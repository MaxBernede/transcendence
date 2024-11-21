import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementController, UserAchievementController, AchievementAPIController } from './achievement.controller';
import { AchievementService, UserAchievementService } from './achievement.service';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AchievementEntity, UserAchievementEntity]), // Register entities
  ],
  controllers: [
    AchievementController,         // Base CRUD or other internal achievement routes
    UserAchievementController,     // User-specific achievement routes
    AchievementAPIController,      // Public API routes like /api/achievements
  ],
  providers: [AchievementService, UserAchievementService], // Register services
  exports: [AchievementService, UserAchievementService],   // Export services if other modules need them
})
export class AchievementModule {}

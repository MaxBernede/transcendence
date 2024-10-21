import { Module } from '@nestjs/common';
import { AchievementController, UserAchievementController } from './achievement.controller';
import { AchievementService, UserAchievementService } from './achievement.service';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'src/ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([AchievementEntity, UserAchievementEntity]),
  ],
  controllers: [AchievementController, UserAchievementController],
  providers: [AchievementService, UserAchievementService]
})
export class AchievementModule {}

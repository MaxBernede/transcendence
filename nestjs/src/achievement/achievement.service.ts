import { Injectable, OnModuleInit } from '@nestjs/common';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/base/base.service';

// Implements keyword call the function at module startup, making sure achievements
// list is filled with the necessary ones
// https://docs.nestjs.com/fundamentals/lifecycle-events
@Injectable()
export class AchievementService
  extends BaseService<AchievementEntity>
  implements OnModuleInit
{
  constructor(
    @InjectRepository(AchievementEntity)
    private readonly achievementRepository: Repository<AchievementEntity>, // Inject Achievement Repository
  ) {
    super(achievementRepository); // Pass repository to the BaseService
  }

  // Lifecycle hook: Runs when the module is initialized
  async onModuleInit() {
    console.log('On Module Init from Achievement Service called');

    try {
      // Fetch all achievements currently in the database
      const achievements = await this.achievementRepository.find();

      // Define the picture linked for each achievement
      if (achievements.length !== 5) {
        const achievementsToCreate = [
          {
            achievementName: 'UserCreated',
            description: 'Yay, you created your user',
            filename: 'icons/user_created.jpg',
          },
          {
            achievementName: 'AddFriend',
            description: 'You added your first friend',
            filename: 'icons/add_friend.png',
          },
          {
            achievementName: 'HaveFriend',
            description: 'You now have a friend!',
            filename: 'icons/have_friend.jpg',
          },
          {
            achievementName: 'BlockUser',
            description: 'You blocked a user',
            filename: 'icons/block_user.jpg',
          },
          {
            achievementName: 'WinGame',
            description: 'You won a game, congrats!',
            filename: 'icons/win_game.jpg',
          },
        ];

        // Save all achievements to the database
        await this.achievementRepository.save(achievementsToCreate);
        console.log('Default achievements have been initialized.');
      } else {
        console.log('Achievements already exist. Skipping initialization.');
      }
    } catch (error) {
      console.error('Error during achievements initialization:', error.message);
      throw error;
    }
  }

  // Method to fetch all achievements from the database
  async findAll(): Promise<AchievementEntity[]> {
    try {
      return this.achievementRepository.find(); // Fetch all achievements
    } 
    catch (error) {
      console.error('Error fetching achievements:', error.message);
      throw error;
    }
  }
}

@Injectable()
export class UserAchievementService extends BaseService<UserAchievementEntity> {
  constructor(
    @InjectRepository(UserAchievementEntity)
    private readonly userAchievementRepository: Repository<UserAchievementEntity>,
    @InjectRepository(AchievementEntity)
    private readonly achievementRepository: Repository<AchievementEntity>, // Inject Achievement Repository
  ) {
    super(userAchievementRepository);
  }

  // Fetch all achievements for a specific user
  async findUserAchievements(userId: string): Promise<AchievementEntity[]> {
    try {
      // Get the user achievements from the userAchievementRepository
      const userAchievements = await this.userAchievementRepository.find({
        where: { userId },
        relations: ['achievement'], // Make sure to load the related achievement data
      });

      // Return the linked achievements
      return userAchievements.map((userAchievement) => userAchievement.achievement);
    } catch (error) {
      console.error('Error fetching user achievements:', error.message);
      throw error;
    }
  }
}


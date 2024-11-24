import { Injectable, OnModuleInit } from '@nestjs/common';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAchievementDto, CreateUserAchievementDto } from './dto/createAchievement.dto';
import { BaseService } from 'src/base/base.service';

// Implements keyword call the function at module startup, making sure achievements
// list is filled with the necessary ones
// https://docs.nestjs.com/fundamentals/lifecycle-events
@Injectable()
export class AchievementService extends BaseService<AchievementEntity> implements OnModuleInit {
	constructor(
		@InjectRepository(AchievementEntity)
		private readonly achievementRepository: Repository<AchievementEntity>, // Inject Achievement Repository
	) {
		super(achievementRepository); // Pass repository to the BaseService
	}

	// Lifecycle hook: Runs when the module is initialized
	async onModuleInit() {
		console.log("On Module Init from Achievement Service called");

		try {
			// Fetch all achievements currently in the database
			const achievements = await this.achievementRepository.find();

			// Define the picture linked for each achievement
			if (achievements.length === 0) {
				const achievementsToCreate = [
					{
						achievementName: 'UserCreated',
						description: 'Yay, you created your user',
						filename: 'user_created.jpg', // Add a relevant filename for this achievement
					},
					{
						achievementName: 'LuckyUser',
						description: 'You got lucky somehow',
						filename: 'lucky_user.jpg', // Add a relevant filename for this achievement
					},
					// {achievementName: 'UserCreated', description: 'Yay, you created your user', filename: 'null'},
					// {achievementName: 'randomAchievement', description: 'You got lucky somehow', filename: 'null'},
					// {achievementName: 'ach1', description: 'ach1'},
					// {achievementName: 'ach2', description: 'ach2'},
					// {achievementName: 'ach3', description: 'ach3'},
					// {achievementName: 'ach4', description: 'ach4'},
					// {achievementName: 'ach5', description: 'ach5'},
				];

				// Save all achievements to the database
				await this.achievementRepository.save(achievementsToCreate);
				console.log('Default achievements have been initialized.');
			} else {
				console.log('Achievements already exist. Skipping initialization.');
			}
		} catch (error) {
			console.error('Error during achievements initialization:', error.message);
			throw error; // Optional: rethrow error to fail application startup
		}
	}

	// Method to fetch all achievements from the database
	async findAll(): Promise<AchievementEntity[]> {
		try {
			return this.achievementRepository.find(); // Fetch all achievements
		} catch (error) {
			console.error('Error fetching achievements:', error.message);
			throw error;
		}
	}

	// Method to create a new achievement if required
	// async create(createAchievementDto: CreateAchievementDto): Promise<AchievementEntity> {
	// 	const newAch = this.achievementRepository.create(createAchievementDto);
	// 	return this.achievementRepository.save(newAch);
	// }
}

@Injectable()
export class UserAchievementService extends BaseService<UserAchievementEntity> {
	constructor(
		@InjectRepository(UserAchievementEntity)
		private readonly userAchievementRepository: Repository<UserAchievementEntity>, // Inject UserAchievement Repository
	) {
		super(userAchievementRepository); // Pass repository to the BaseService
	}

	// Use the correct property: userAchievementRepository
	async findAll(): Promise<UserAchievementEntity[]> {
		try {
			return this.userAchievementRepository.find(); // Fetch all user achievements
		} catch (error) {
			console.error('Error fetching user achievements:', error.message);
			throw error;
		}
	}
}

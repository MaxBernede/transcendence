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
		private readonly achievementRepository: Repository<AchievementEntity>,
	) {
		super(achievementRepository);
	}

	async onModuleInit(){
		console.log("On Module Init from Achievement Service called")
		const achievements = await this.achievementRepository.find();

		// Define the picture linked for each achievments ?
		if (achievements.length === 0){
			const achievementsToCreate = [
				{achievementName: 'UserCreated', description: 'Yay, you created your user', filename: 'null'},
				{achievementName: 'randomAchievement', description: 'You got lucky somehow', filename: 'null'},
				// {achievementName: 'ach1', description: 'ach1'},
				// {achievementName: 'ach2', description: 'ach2'},
				// {achievementName: 'ach3', description: 'ach3'},
				// {achievementName: 'ach4', description: 'ach4'},
				// {achievementName: 'ach5', description: 'ach5'},
			];

			//! How to create them ?
			// for (const achievement of achievementsToCreate){
			// 	await this.create(achievement);
			// }
		}
	}

	// async create(createAchivementDto: CreateAchievementDto): Promise<AchievementEntity> {
	// 	const newAch = this.achievementRepository.create(createAchivementDto);
	// 	return this.achievementRepository.save(newAch);
	// }

}

@Injectable()
export class UserAchievementService extends BaseService<UserAchievementEntity>{
	constructor(
		@InjectRepository(UserAchievementEntity)
		private readonly userAchievementRepository: Repository<UserAchievementEntity>,
	) {
		super(userAchievementRepository);
	}

}
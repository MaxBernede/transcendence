import { Controller, Get, Post, Body, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { AchievementService, UserAchievementService } from './achievement.service';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';
import { CreateAchievementDto, CreateUserAchievementDto } from './dto/createAchievement.dto';
import { BadRequestException } from '@nestjs/common';
import { BaseController } from 'src/base/base.controller';

@Controller('achievement')
export class AchievementController extends BaseController<AchievementEntity>{
	constructor(private readonly AchievementService: AchievementService) {
		super(AchievementService);
	}

	// @Post()
	// @UsePipes(ValidationPipe)
	// async create(@Body() CreateAchievementDto: CreateAchievementDto): Promise<AchievementEntity> {
	// 	try {
	// 		const achievement = await this.AchievementService.create(CreateAchievementDto);
	// 		return achievement;
	// 	}
	// 	catch (error){
	// 		console.log("Achievement has not been created because:", error.message);
	// 		throw new BadRequestException('Achievement could not be created.'); // Customize the response message
	// 	}
	// }

}

@Controller('UserAchievement')
export class UserAchievementController extends BaseController<UserAchievementEntity>{
	constructor(private readonly UserAchievementService: UserAchievementService) {
		super(UserAchievementService)
	}
}


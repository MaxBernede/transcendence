import { Controller, Get, Post, Body, Param, Delete, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { AchievementService, UserAchievementService } from './achievement.service';
import { AchievementEntity, UserAchievementEntity } from './achievement.entity';
import { CreateAchievementDto, CreateUserAchievementDto } from './dto/createAchievement.dto';
import { BaseController } from 'src/base/base.controller';

// Base Achievement Controller
@Controller('achievement')
export class AchievementController extends BaseController<AchievementEntity> {
  constructor(private readonly achievementService: AchievementService) {
    super(achievementService);
  }

  // Example of a POST method (commented for now)
  // @Post()
  // @UsePipes(ValidationPipe)
  // async create(@Body() CreateAchievementDto: CreateAchievementDto): Promise<AchievementEntity> {
  //   try {
  //     const achievement = await this.achievementService.create(CreateAchievementDto);
  //     return achievement;
  //   } catch (error) {
  //     console.log("Achievement has not been created because:", error.message);
  //     throw new BadRequestException('Achievement could not be created.');
  //   }
  // }
}

// User Achievement Controller
@Controller('UserAchievement')
export class UserAchievementController extends BaseController<UserAchievementEntity> {
  constructor(private readonly userAchievementService: UserAchievementService) {
    super(userAchievementService);
  }
}

// API Controller for Fetching Achievements
@Controller('api/achievements') // Clear route for fetching achievements
export class AchievementAPIController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  async getAllAchievements(): Promise<AchievementEntity[]> {
    try {
      return await this.achievementService.findAll(); // Fetch all achievements
    } catch (error) {
      console.error('Error fetching achievements:', error.message);
      throw new BadRequestException('Could not retrieve achievements.');
    }
  }
}

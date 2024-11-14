import { IsString, IsNumber} from "class-validator";

export class CreateAchievementDto {
	@IsString()
	achievementName: string;

	@IsString()
	description: string;

	@IsString()
	filename?: string;
}

export class CreateUserAchievementDto {
	@IsNumber()
	userId: number;

	@IsNumber()
	achievementId: number;
}
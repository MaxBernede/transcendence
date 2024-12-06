import {
	Controller,
	Get,
	Post,
	Patch,
	Param,
	Put,
	Body,
	UploadedFile,
	UseInterceptors,
	BadRequestException,
	ParseIntPipe,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { UserService } from './user.service';
  import { MatchService } from '../match/match.service';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { UpdateUserDto } from './dto/UpdateUser.dto';
  import { CreateUserDto } from './dto/createUser.dto';
  import { Match } from '../match/match.entity';

  
  @Controller('api/users')
  export class UserController {
	constructor(
	  private readonly userService: UserService,
	  private readonly matchService: MatchService,
	) {}
  
	@Post()
	async createUser(@Body() createUserDto: CreateUserDto) {
	  return this.userService.createUser(createUserDto);
	}
  
	@Put(':id')
	async updateUser(@Param('id') id: string, @Body() updatedData: UpdateUserDto) {
	  return this.userService.updateUser(id, updatedData);
	}
  
	@Get(':id')
	async getUser(@Param('id') id: string) {
	  const isNumericId = !isNaN(Number(id));
	  const user = await this.userService.findOne(isNumericId ? +id : id);

	  return user;
	}

	@Get(':id/with-relations')
	async getUserWithRelations(@Param('id', ParseIntPipe) id: number) {
		return this.userService.findOneWithRelations(id);
	}
	
	
  
	@Get('user/:id/match-history')
	async getMatchHistory(@Param('id', ParseIntPipe) id: number) {
	  const matchHistory = await this.matchService.findByUser(id);
	  return matchHistory.map((match) => ({
		description: `${match.type} vs ${match.opponent} - ${match.result} (${match.score})`,
		date: new Date(match.date).toLocaleDateString('en-GB'),
	  }));
	}
  
	@Patch(':id/update-username')
	async updateUsername(
	  @Param('id') id: string,
	  @Body('username') newUsername: string,
	) {
	  if (!newUsername || newUsername.trim().length === 0) {
		throw new BadRequestException('Username cannot be empty');
	  }
  
	  const updatedUser = await this.userService.updateUser(id, { username: newUsername.trim() });
	  return { username: updatedUser.username };
	}
  
	@Post(':id/upload-avatar')
	@UseInterceptors(
	  FileInterceptor('file', {
		storage: diskStorage({
		  destination: './uploads/avatars',
		  filename: (req, file, callback) => {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
			callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
		  },
		}),
		fileFilter: (req, file, callback) => {
		  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
			return callback(new BadRequestException('Only image files are allowed'), false);
		  }
		  callback(null, true);
		},
	  }),
	)
	async uploadAvatar(
	  @Param('id') id: string,
	  @UploadedFile() file: Express.Multer.File,
	) {
	  if (!file) {
		throw new BadRequestException('File is required');
	  }
  
	  const avatarPath = `http://localhost:3000/uploads/avatars/${file.filename}`;
	  const updatedUser = await this.userService.updateUser(id, { avatar: avatarPath });
	  return { avatar: avatarPath };
	}
  
	@Post(':userId/add-friend/:friendId')
	async addFriend(
	  @Param('userId', ParseIntPipe) userId: number,
	  @Param('friendId', ParseIntPipe) friendId: number,
	) {
	  return this.userService.addFriend(userId, friendId);
	}

	@Put(':id/match-history')
	async updateMatchHistory(
 	 @Param('id', ParseIntPipe) userId: number,
  	@Body() matchUpdates: Match[],
	) {
  	return this.matchService.updateMatchHistory(userId, matchUpdates);
	}

	@Put(':id/achievement')
	async updateAchievements(
	  @Param('id', ParseIntPipe) userId: number,
	  @Body('achievements') achievementIds: number[],
	) {
	  return this.userService.updateAchievements(userId, achievementIds);
	}
	
  }

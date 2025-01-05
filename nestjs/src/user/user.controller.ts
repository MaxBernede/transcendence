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
	Req,
	UseGuards,
	Res,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname, join } from 'path';
  import { UserService } from './user.service';
  import { MatchService } from '../match/match.service';
  import { UpdateUserDto } from './dto/UpdateUser.dto';
  import { CreateUserDto } from './dto/createUser.dto';
  import { Match } from '../match/match.entity';
  import { Public } from 'src/decorators/public.decorator';
  import { AuthGuard } from 'src/auth/auth.guard';
  import axios from 'axios';
  import { Response } from 'express';
  import * as fs from 'fs';
  
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
    console.log('Updated Data Received:', updatedData);
    return this.userService.updateUser(id, updatedData);
}
  
	@Get(':id')
	async getUser(@Param('id') id: string) {
	  return this.userService.getUser(id); 
	}
  
	@UseGuards(AuthGuard)
	@Get('me')
	async getLoggedInUser(@Req() request: any) {
		console.log('Request to /me received');
	  const userId = request.user?.sub;
	  if (!userId) {
		throw new BadRequestException('Unable to determine user from token.');
	  }
	  return this.userService.findOneById(userId);
	}
  
	@Post(':id/upload-avatar')
@UseInterceptors(
	FileInterceptor('file', {
		storage: diskStorage({
		  destination: './uploads/avatars',
		  filename: (req, file, callback) => {
			console.log('Writing file to destination:', './uploads/avatars');
			const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
			callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
		  },
		}),
		fileFilter: (req, file, callback) => {
		  console.log('File received:', file.originalname);
		  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
			console.log('Invalid file type:', file.mimetype);
			return callback(new BadRequestException('Only image files are allowed'), false);
		  }
		  callback(null, true);
		},
	  })	  
)
async uploadAvatar(
	@Param('id') userId: string,
	@UploadedFile() file: Express.Multer.File,
  ) {
	if (!file) {
	  throw new BadRequestException('No file uploaded');
	}
	const avatarUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;
	console.log('New avatar URL:', avatarUrl);
	await this.userService.updateAvatar(userId, avatarUrl);
	return { avatar: avatarUrl };
  }
	  
  
	@Patch(':id/avatar')
	async updateAvatar(@Param('id') id: string, @Body('avatar') avatar: string) {
	  if (!avatar) {
		throw new BadRequestException('Avatar URL is required');
	  }
  
	  const updatedUser = await this.userService.updateAvatar(id, avatar);
	  return {
		message: 'Avatar updated successfully',
		avatar: updatedUser.avatar,
	  };
	}
  
	@Get('avatar/:username')
	async proxyAvatar(@Param('username') username: string, @Res() res: Response) {
	  const url = `https://cdn.intra.42.fr/users/${username}.jpg`;
  
	  try {
		const response = await axios.get(url, {
		  responseType: 'arraybuffer',
		  headers: {
			'User-Agent': 'Mozilla/5.0',
		  },
		});
  
		res.setHeader('Content-Type', response.headers['content-type']);
		res.send(response.data);
	  } catch (error) {
		console.error(`Error fetching avatar for ${username}:`, error.message);
		res.status(404).send('Image not found');
	  }
	}
  
	@Get('user/:id/match-history')
	async getMatchHistory(@Param('id', ParseIntPipe) id: number) {
	  const matchHistory = await this.matchService.findByUser(id);
	  
	  if (!matchHistory || matchHistory.length === 0) {
		return []; // Ensure an empty array is returned if no matches exist
	  }
	  
	  return matchHistory.map((match) => ({
		id: match.id,
		type: match.type,
		opponent: match.opponent,
		result: match.result,
		score: match.score,
		description: `${match.type} vs ${match.opponent} - ${match.result} (${match.score})`,
		date: new Date(match.date).toLocaleDateString('en-GB'),
	  }));
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

	@Get(':id/achievements')
	async getUserAchievements(@Param('id', ParseIntPipe) id: number) {
		const user = await this.userService.getUserWithAchievements(id); 
		return user.achievements;
	}
	
  }
  
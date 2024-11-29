	import { Controller, Get, Post, Patch, Param, Put, Body, UploadedFile, UseInterceptors, BadRequestException, ParseIntPipe 
	} from '@nestjs/common';
	import { FileInterceptor } from '@nestjs/platform-express';
	import { UserService } from './user.service';
	import { MatchService } from '../match/match.service'; // Make sure this is imported
	import { diskStorage } from 'multer';
	import { extname } from 'path';
	import { UpdateUserDto } from './dto/UpdateUser.dto';
	import { CreateUserDto } from './dto/createUser.dto';
	
	@Controller('api/users')
	export class UserController {
		constructor(
		private readonly userService: UserService,
		private readonly matchService: MatchService, // Inject MatchService
		) {}

		@Post()
		async createUser(@Body() createUserDto: CreateUserDto) {
		  return this.userService.createUser(createUserDto);
		}

		@Put(':id')
		async updateUser(@Param('id') id: string, @Body() updatedData: UpdateUserDto) {
		return this.userService.updateUser(id, updatedData);
		}

		// Get user by ID or username
		@Get(':id')
		async getUser(@Param('id') id: string) {
			const isNumericId = !isNaN(Number(id));
			const user = await this.userService.findOne(isNumericId ? +id : id);
		// Fetch achievements separately if not already in the user entity
		const achievements = await this.userService.findAchievementsForUser(user.id);
		console.log('Returning user data:', user);
		return user; // Ensure `username` is included in the returned user object
		}
	
		// Endpoint to get match history
		@Get('user/:id/match-history')
		async getMatchHistory(@Param('id') id: number) {
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
		console.log(`Received PATCH request for ID: ${id} with new username: ${newUsername}`);
	
		if (!newUsername || newUsername.trim().length === 0) {
			throw new BadRequestException('Username cannot be empty');
		}
	
		const updatedUser = await this.userService.updateUsername(id, newUsername.trim());
		return { username: updatedUser.username }; // Return the updated username
		}
	
		// Upload avatar
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
		console.log('Saving avatarPath:', avatarPath);
	
		// Update the avatar in the database
		const updatedUser = await this.userService.updateAvatar(id, avatarPath);
		console.log('Updated user with avatar:', updatedUser);
	
		return { avatar: avatarPath };
		}
	
		// Add a friend
		@Post(':userId/add-friend/:friendId')
		async addFriend(
		@Param('userId', ParseIntPipe) userId: number,
		@Param('friendId', ParseIntPipe) friendId: number,
		) {
		return this.userService.addFriend(userId, friendId);
		}
	}
	
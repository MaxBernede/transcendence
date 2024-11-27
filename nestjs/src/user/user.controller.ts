import { 
	Controller, 
	Get, 
	Post, 
	Body, 
	Param, 
	Delete, 
	UsePipes, 
	ValidationPipe, 
	UseInterceptors, 
	UploadedFile, 
	BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { Multer } from 'multer';
import { BaseController } from 'src/base/base.controller';
import { Express } from 'express';
import { Public } from 'src/decorators/public.decorator';

	@Controller('users')
	export class UsersController extends BaseController<User> {
		constructor(private readonly UsersService: UsersService) {
			super(UsersService)
		}
		
		@Post(':userId/add-friend/:friendId')
		async addFriend(@Param('userId') userId: string, @Param('friendId') friendId: string): Promise<User> {
			return this.UsersService.addFriend(Number(userId), Number(friendId));
		}
		
		@Get(':userId/friends')
		async getFriends(@Param('userId') userId: string): Promise<User[]> {
			return this.UsersService.getFriends(Number(userId));
		}
		
	
		@Post('upload-avatar/:id')
		@UseInterceptors(FileInterceptor('file', { dest: './uploads/avatars' }))
		async uploadAvatar(
		  @Param('id') userId: string,
		  @UploadedFile() file: Multer.File,
		): Promise<User> {
		  if (!file) {
			throw new BadRequestException('File is required');
		  }
		  return this.UsersService.updateAvatar(Number(userId), file.filename);
		}

		// check account with the identifier:"string" in the POST body
		@Post('check-account')
		async checkAccount(@Body() body: { identifier: string }): Promise<boolean> {
			const { identifier } = body;
			if (!identifier) {
				throw new Error('Identifier is required');
			}
			return this.UsersService.doesUserExist(identifier);
		}

		// TO IMPLEMENT NEXT
		@Post('auth')
		async auth(@Body() body: { email: string }): Promise<boolean> {
			const { email } = body;
			console.log("auth of the backend");
			return this.UsersService.doesUserExist(email);
		}

		// promise JWT token ?
		@Public()
		@Post('register')
		async register(@Body() body: CreateUserDto) {
			const { username, email, password } = body;
			// Check if user already exists
			const userExists = await this.UsersService.doesUserExist(email);
			if (userExists) {
				throw new BadRequestException('User with this email already exists.');
			}
	
			// Create and save the new user
			const newUser = await this.UsersService.create(body);
	
			// Return the created user (omit sensitive information)
			return {
				id: newUser.id,
				username: newUser.username,
				email: newUser.email,
			};
		}
	}
	
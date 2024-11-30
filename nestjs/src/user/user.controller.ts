import { 
	Controller,
	Res,
	Get, 
	Post, 
	Body, 
	Param, 
	Delete, 
	UsePipes, 
	ValidationPipe, 
	UseInterceptors, 
	UploadedFile, 
	BadRequestException,
	Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { Multer } from 'multer';
import { BaseController } from 'src/base/base.controller';
import { Express, Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { stringify } from 'querystring';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

	@Controller('users')
	export class UsersController extends BaseController<User> {
		constructor(
			private readonly UsersService: UsersService,
			private readonly configService: ConfigService,
		) {
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
		@Public()
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

		// Sorry if my code sucks, trying my best rn
		@Public()
		@Get('loginintra')
		async login(@Res() res: Response) {
			const clientId = this.configService.get<string>('INTRA_CLIENT_ID');
			const redirectUri = 'http://localhost:3000/users/callback'
			const clientSecret = this.configService.get<string>('INTRA_CLIENT_SECRET');		
			
			
			if (!redirectUri) { // Change the check to all here
			  console.error('Missing INTRA_REDIRECT_URI');
			  return res.status(400).json({ message: 'Missing required environment variables.' });
			}
			const params = {
				client_id: clientId,
				secret: clientSecret,
				redirect_uri: redirectUri,
			};
			console.log(params);
			const authUrl = `https://api.intra.42.fr/oauth/authorize?${stringify(params)}`;
			console.log('Auth URL:', authUrl);
			res.json({ url: authUrl }); // Send the URL to the frontend
		}

		@Public()
		@Get('callback')
		async callback(@Query('code') jwt: string, @Res() res: Response) {
			// If no authorization code is provided, return an error
			if (!jwt) {
				return res.status(400).json({ message: 'Authorization code not provided.' });
			}
			console.log('JWT:', jwt);
			const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
				headers: {
				  Authorization: `Bearer${jwt}`,
				  'Content-Type': 'application/json'
				},
			});
			try {
			console.log('User Info:', userResponse.data);

				return res.redirect(`http://localhost:3001/loginIntra?token=${jwt}`);
			}
			catch (error) {
				console.error('Error during code exchange:', error.response?.data || error);
				return res.status(500).json({ message: 'Error during code exchange.' });
			}
		}
	}
	
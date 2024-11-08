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
	
	@Controller('users')
	export class UsersController {
		constructor(private readonly usersService: UsersService) {}
	
		@Get()
		async findAll(): Promise<User[]> {
		return this.usersService.findAll();
		}
	
		@Post()
		@UsePipes(ValidationPipe)
		async create(@Body() createUserDto: CreateUserDto): Promise<User> {
		try {
			const user = await this.usersService.create(createUserDto);
			return user;
		} catch (error) {
			console.log("User has not been created because:", error.message);
			throw new BadRequestException('User could not be created.');
		}
		}
	
		@Get(':id')
		async findOne(@Param('id') id: string): Promise<User> {
			return this.usersService.findOne(Number(id));
		}
		
		@Delete(':id')
		async remove(@Param('id') id: string): Promise<void> {
			return this.usersService.remove(Number(id));
		}
		
		@Post(':userId/add-friend/:friendId')
		async addFriend(@Param('userId') userId: string, @Param('friendId') friendId: string): Promise<User> {
			return this.usersService.addFriend(Number(userId), Number(friendId));
		}
		
		@Get(':userId/friends')
		async getFriends(@Param('userId') userId: string): Promise<User[]> {
			return this.usersService.getFriends(Number(userId));
		}
		
	
		@Post('upload-avatar/:id')
		@UseInterceptors(FileInterceptor('file', { dest: './uploads/avatars' }))
		async uploadAvatar(
		  @Param('id') userId: string,
		  @UploadedFile() file: Express.Multer.File,
		): Promise<User> {
		  if (!file) {
			throw new BadRequestException('File is required');
		  }
		  return this.usersService.updateAvatar(Number(userId), file.filename);
		}
	}
	
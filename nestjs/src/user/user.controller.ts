import { Controller, Get, Post, Body, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { BadRequestException } from '@nestjs/common';

@Controller('Users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	async findAll(): Promise<User[]> {
		// return [{ id: 1, name: 'John Doe', email: 't@test.com'}];
		return this.usersService.findAll();
	}

	
	@Post()
	@UsePipes(ValidationPipe)
	async create(@Body() createUserDto: CreateUserDto): Promise<User> {
		try {
			const user = await this.usersService.create(createUserDto);
			return user;
		}
		catch (error){
			console.log("User has not been created because:", error.message);
			throw new BadRequestException('User could not be created.'); // Customize the response message
		}
	}

	@Get(':id') // Retrieve a single user by ID
	async findOne(@Param('id') id: number): Promise<User> {
		return this.usersService.findOne(id);
	}

	@Delete(':id') // Delete a user by ID
	async remove(@Param('id') id: number): Promise<void> {
		return this.usersService.remove(id);
	}
}

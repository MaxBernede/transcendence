import { Injectable, NotFoundException, BadRequestException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { BaseService } from 'src/base/base.service';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService extends BaseService<User> implements OnModuleInit {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) {
		super(usersRepository)
	}

	//On module init is run at the start of the project
	async onModuleInit(){
		console.log("User Init");
		const users = await this.usersRepository.find();

		// Check number of user and add a default admin one
		if (users.length === 0){
			const adminuser: CreateUserDto = {username: 'admin', email: 'amdin@admin.test', password: 'admin'}
			await this.create(adminuser)
		}
	}

	// Method to create a new user
	async create(createUserDto: CreateUserDto): Promise<User> {
		const newUser = this.usersRepository.create(createUserDto);
		return await this.usersRepository.save(newUser);
	}

	// Method to add a friend
	async addFriend(userId: number, friendId: number): Promise<User> {
		if (userId === friendId) {
			throw new BadRequestException('Cannot add yourself as a friend');
		}

		const user = await this.usersRepository.findOne({
			where: { id: userId },
			relations: ['friends'],
		});

		const friend = await this.usersRepository.findOne({
			where: { id: friendId },
		});

		if (!user) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		if (!friend) {
			throw new NotFoundException(`User with ID ${friendId} not found`);
		}

		if (!user.friends.find((existingFriend) => existingFriend.id === friendId)) {
			user.friends.push(friend);
			await this.usersRepository.save(user);
		}

		return user;
	}

	// Method to get a user's friends
	async getFriends(userId: number): Promise<User[]> {
		const user = await this.usersRepository.findOne({
			where: { id: userId },
			relations: ['friends'],
		});

		if (!user) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		return user.friends;
	}

	async updateAvatar(userId: number, avatarFileName: string): Promise<User> {
		const user = await this.usersRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		user.avatar = avatarFileName; // Save the filename to the user entity
		return this.usersRepository.save(user);
		}
	
	// I didnt wanted to implement it here again but I had a strange bug to use it in auth.service
	async findOneByUsername(username: string): Promise<User> {
		return await this.usersRepository.findOne({
		  where: {
			username: username,
		  },
		});
	  }

	// True or false if exist in DBB
	async doesUserExist(identifier: string): Promise<boolean> {
		if (!identifier) {
			throw new Error('Identifier is required');
		}
	
		try {
			// First, check if it's a username
			let user = await this.usersRepository.findOneBy({ username: identifier });
			if (user) return true;
	
			// If not found, check if it's an email
			user = await this.usersRepository.findOneBy({ email: identifier });
			return !!user; // Return true if user exists
		} catch (error) {
			throw new Error('Error checking user existence');
		}
	}
	
	// Password Protection
	async hashPassword(password: string): Promise<string>{
	  console.log("hashing : ", password);
	  return await bcrypt.hash(password, 10);
	}
	
	async validatePassword(enteredPassword: string, storedHash: string): Promise<boolean>{
	  const isMatch = await bcrypt.compare(enteredPassword, storedHash);
	  return isMatch;
	};
	
}
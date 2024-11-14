import { Injectable, NotFoundException, BadRequestException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { BaseService } from 'src/base/base.service';

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
	async findOneBy(options: any): Promise<User | undefined> {
		return this.usersRepository.findOneBy(options); // Directly using the repository's findOneBy
		}

}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) {}

	async findAll(): Promise<User[]> {
		return this.userRepository.find();
	}

	// I've put the try catch in the controller, maybe it should be here ? IDK
	async create(createUserDto: CreateUserDto): Promise<User> {
		const newUser = this.userRepository.create(createUserDto);
		return this.userRepository.save(newUser);
	}

	async findOne(id: number): Promise<User> {
		// Logic to find a user by ID
		return
	}

	// Implement update i'm not sure how
	async update(id: number, user: User): Promise<User> {
		// Logic to update a user
		return
	}

	async remove(id: number): Promise<void> {
		// Logic to delete a user
		return
	}
}

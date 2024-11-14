import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Find a user by ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['friends'], // Include friends in the result
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Create a new user
  async create(username: string, email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }
    const user = this.userRepository.create({ username, email, password });
    return this.userRepository.save(user);
  }

  async updateUsername(id: string, newUsername: string): Promise<User> {
	const userId = parseInt(id, 10); // Convert string ID to a number
	if (isNaN(userId)) {
	  throw new BadRequestException('Invalid user ID');
	}
  
	// Find the user by ID
	const user = await this.userRepository.findOne({ where: { id: userId } });
	if (!user) {
	  throw new NotFoundException(`User with ID ${userId} not found`);
	}
  
	// Check if the new username is already taken
	const usernameTaken = await this.userRepository.findOne({ where: { username: newUsername } });
	if (usernameTaken && usernameTaken.id !== userId) {
	  throw new BadRequestException('Username is already taken');
	}
  
	// Update the username
	user.username = newUsername;
	return this.userRepository.save(user);
  }
  
  
  // Add a friend
  async addFriend(userId: number, friendId: number): Promise<User> {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }
    const user = await this.findOne(userId);
    const friend = await this.findOne(friendId);
    if (!user.friends.find((f) => f.id === friendId)) {
      user.friends.push(friend);
      await this.userRepository.save(user);
    }
    return user;
  }

  // Get all friends for a user
  async getFriends(id: number): Promise<User[]> {
    const user = await this.findOne(id);
    return user.friends;
  }
}

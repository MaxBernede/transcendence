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

  async findOne(idOrUsername: string | number): Promise<User> {
	console.log(`Searching for user with ID or username: ${idOrUsername}`);
  
	let whereClause;
  
	if (typeof idOrUsername === 'number') {
	  // If it's a number, search by ID
	  whereClause = { id: idOrUsername };
	  console.log(`Searching by ID: ${whereClause.id}`);
	} else {
	  // If it's a string, search by username
	  whereClause = { username: idOrUsername };
	  console.log(`Searching by username: ${whereClause.username}`);
	}
  
	console.log(`Where clause:`, whereClause);
  
	// Debug: Use a raw SQL query to check if the user exists
	const result = await this.userRepository.query(
	  `SELECT * FROM "user" WHERE username = $1`,
	  [idOrUsername]
	);
	console.log('Raw Query Result:', result);
  
	// Use the ORM findOne method to retrieve the user
	const user = await this.userRepository.findOne({
	  where: whereClause,
	  relations: ['friends'], // Add relations if necessary
	});
  
	if (!user) {
	  console.error(`User not found for:`, whereClause);
	  throw new NotFoundException(`User with ID or username "${idOrUsername}" not found`);
	}
  
	console.log(`Found user:`, user);
	return user;
  }
  
  
  async updateUsername(idOrUsername: string | number, newUsername: string): Promise<User> {
	console.log(`Updating username for ID or username: ${idOrUsername} to: ${newUsername}`);
  
	// Check if the new username is empty
	if (!newUsername.trim()) {
	  throw new BadRequestException('Username cannot be empty');
	}
  
	// Check if the new username is already taken
	const existingUser = await this.userRepository.findOne({
	  where: { username: newUsername.trim() },
	});
	if (existingUser) {
	  throw new BadRequestException(`Username "${newUsername}" is already taken`);
	}
  
	// Retrieve the user by ID or username
	const user = await this.findOne(idOrUsername); // findOne already searches by username or ID
	if (!user) {
	  throw new NotFoundException(`User with ID or username "${idOrUsername}" not found`);
	}
  
	// Update the username
	user.username = newUsername.trim();
	await this.userRepository.save(user);
  
	console.log(`Updated user:`, user);
	return user;
  }
  

  // Handle avatar updates
  async updateAvatar(userId: number, avatarPath: string): Promise<User> {
    const user = await this.findOne(userId);

    // Update avatar path
    user.avatar = avatarPath;
    return this.userRepository.save(user);
  }

  // Add a friend
  async addFriend(userId: number, friendId: number): Promise<User> {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    const user = await this.findOne(userId);
    const friend = await this.findOne(friendId);

    if (user.friends.find((f) => f.id === friendId)) {
      throw new BadRequestException('User is already a friend');
    }

    user.friends.push(friend);
    return this.userRepository.save(user);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Match } from '../match/match.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>, // Add Match repository
  ) {}

  // Existing findOne method
  async findOne(idOrUsername: string | number): Promise<User> {
    console.log(`Searching for user with ID or username: ${idOrUsername}`);

    let whereClause;

    if (typeof idOrUsername === 'number') {
      whereClause = { id: idOrUsername }; // Search by ID
      console.log(`Searching by ID: ${whereClause.id}`);
    } else {
      whereClause = { username: idOrUsername }; // Search by username
      console.log(`Searching by username: ${whereClause.username}`);
    }

    console.log(`Where clause:`, whereClause);

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

async findOneWithMatchHistory(idOrUsername: string): Promise<{ user: User; matchHistory: Match[] }> {
    const user = await this.findOne(idOrUsername);
    if (!user) throw new NotFoundException(`User not found: ${idOrUsername}`);

    const matchHistory = await this.matchRepository.find({
        where: { user: { id: user.id } },
        relations: ['user'],
    });

    return { user, matchHistory };
}

  // Existing updateUsername method
  async updateUsername(idOrUsername: string | number, newUsername: string): Promise<User> {
    console.log(`Updating username for ID or username: ${idOrUsername} to: ${newUsername}`);

    if (!newUsername.trim()) {
      throw new BadRequestException('Username cannot be empty');
    }

    const existingUser = await this.userRepository.findOne({
      where: { username: newUsername.trim() },
    });
    if (existingUser) {
      throw new BadRequestException(`Username "${newUsername}" is already taken`);
    }

    const user = await this.findOne(idOrUsername);
    if (!user) {
      throw new NotFoundException(`User with ID or username "${idOrUsername}" not found`);
    }

    user.username = newUsername.trim();
    await this.userRepository.save(user);

    console.log(`Updated user:`, user);
    return user;
  }

  // Existing updateAvatar method
  async updateAvatar(idOrUsername: string | number, avatarPath: string): Promise<User> {
    console.log(`Updating avatar for ID or username: ${idOrUsername} to: ${avatarPath}`);

    const user = await this.findOne(idOrUsername);
    if (!user) {
      throw new NotFoundException(`User with ID or username "${idOrUsername}" not found`);
    }

    user.avatar = avatarPath;
    return this.userRepository.save(user);
  }

  // Existing addFriend method
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

  async findAchievementsForUser(userId: number): Promise<any[]> {
	// Assuming achievements are stored in a related table with a foreign key
	return this.matchRepository.query(`
	  SELECT achievementName FROM achievement_entity 
	  WHERE id IN (
		SELECT achievementId FROM user_achievement_entity WHERE userId = $1
	  )
	`, [userId]);
  }
}

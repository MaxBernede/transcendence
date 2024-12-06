import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Match } from '../match/match.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { AchievementEntity } from '../achievement/achievement.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(AchievementEntity)
    private readonly achievementRepository: Repository<AchievementEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    const newUser = this.userRepository.create({
      username,
      email,
      password,
    });

    return this.userRepository.save(newUser);
  }

  async updateUser(id: string, updatedData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
        where: { id: +id },
        relations: ['achievements', 'matchHistory', 'friends'], // Ensure relations are loaded
    });

    if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Handle achievements update
    if (updatedData.achievements && Array.isArray(updatedData.achievements)) {
        const achievementIds = updatedData.achievements.map((achievement) => {
            if (typeof achievement === 'number') {
                return achievement;
            } else if (typeof achievement === 'object' && 'id' in achievement) {
                return achievement.id;
            } else {
                throw new BadRequestException('Invalid achievement format');
            }
        });

        const achievementEntities = await this.achievementRepository.findByIds(achievementIds);
        if (achievementEntities.length !== achievementIds.length) {
            throw new BadRequestException('Some achievements not found');
        }

        user.achievements = achievementEntities;
    }

    // Handle match history update
    if (updatedData.matchHistory && Array.isArray(updatedData.matchHistory)) {
        const matches = updatedData.matchHistory.map((match) => {
            if (typeof match === 'object') {
                return this.matchRepository.create(match);
            }
            throw new BadRequestException('Invalid match format');
        });

        await this.matchRepository.save(matches); // Save new matches
        user.matchHistory = matches;
    }

    Object.assign(user, updatedData); // Update other fields
    return this.userRepository.save(user);
}

async findOneWithRelations(id: number): Promise<User> {
	return this.userRepository.findOne({
	  where: { id },
	  relations: ['achievements', 'matchHistory', 'friends'],
	});
  }

  async findOne(idOrUsername: string | number): Promise<User> {
    const whereClause =
      typeof idOrUsername === 'number'
        ? { id: idOrUsername }
        : { username: idOrUsername };

    const user = await this.userRepository.findOne({
      where: whereClause,
      relations: ['friends', 'achievements', 'matchHistory'], // Include matchHistory and achievements
    });

    if (!user) {
      throw new NotFoundException(`User with ID or username "${idOrUsername}" not found`);
    }

    return user;
}

  async findOneWithMatchHistory(
    idOrUsername: string,
  ): Promise<{ user: User; matchHistory: Match[] }> {
    const user = await this.findOne(idOrUsername);

    const matchHistory = await this.matchRepository.find({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    return { user, matchHistory };
  }

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

  async findAchievementsForUser(userId: number): Promise<AchievementEntity[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['achievements'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return user.achievements;
  }
  async updateAchievements(userId: number, achievementIds: number[]): Promise<User> {
	const user = await this.userRepository.findOne({
	  where: { id: userId },
	  relations: ['achievements'],
	});
  
	if (!user) {
	  throw new NotFoundException(`User with ID "${userId}" not found`);
	}
  
	const achievements = await this.achievementRepository.findByIds(achievementIds);
  
	if (achievements.length !== achievementIds.length) {
	  throw new BadRequestException('Some achievements not found');
	}
  
	user.achievements = achievements;
	return this.userRepository.save(user);
  }  
  
}

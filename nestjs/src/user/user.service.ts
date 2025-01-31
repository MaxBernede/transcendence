import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Match } from '../match/match.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { AchievementEntity } from '../achievement/achievement.entity';
import * as fs from 'fs';
import * as path from 'path';

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
    const { username, email, password, image } = createUserDto;

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
      avatar: image?.link || '/assets/Bat.jpg',
      image,
    });

    return this.userRepository.save(newUser);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: +id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prioritize `image.link`, then `avatar`, and finally the default avatar
    user.avatar = user.image?.link || user.avatar || '/assets/Bat.jpg';

    console.log('Final Avatar Returned:', user.avatar);
    return user;
  }

  async getUserWithAchievements(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['achievements'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatar = user.image?.link || user.avatar || '/assets/Bat.jpg';

    return user;
  }

  async updateUser(id: string, updatedData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: +id },
      relations: ['achievements', 'matchHistory', 'friends'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    console.log('Before Update:', user);
    console.log('Updated Data Received:', updatedData);

    if (updatedData.wins !== undefined) {
      console.log(`Updating wins from ${user.wins} to ${updatedData.wins}`);
      user.wins = updatedData.wins;
    }
    if (updatedData.loose !== undefined) {
      console.log(`Updating losses from ${user.loose} to ${updatedData.loose}`);
      user.loose = updatedData.loose;
    }
    if (updatedData.ladder_level !== undefined) {
      console.log(
        `Updating ladder level from ${user.ladder_level} to ${updatedData.ladder_level}`,
      );
      user.ladder_level = updatedData.ladder_level;
    }

    if (updatedData.avatar) {
      console.log('Updating avatar:', updatedData.avatar);
      user.avatar = updatedData.avatar;
    }

    if (updatedData.image) {
      console.log('Updating image:', updatedData.image);
      user.image = updatedData.image;
      user.avatar =
        updatedData.image.link ||
        updatedData.image.versions?.large ||
        '/assets/Bat.jpg';
      console.log('Updated avatar based on image:', user.avatar);
    }

    Object.assign(user, updatedData);

    console.log('Final User Object before saving:', user);

    return this.userRepository.save(user);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: +id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.avatar &&
      user.avatar.startsWith('http://localhost:3000/uploads/avatars/')
    ) {
      // Remove the old file if it's a local file
      const oldFilePath = path.join(
        __dirname,
        '../../uploads/avatars',
        path.basename(user.avatar),
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    user.avatar = avatarUrl; // Set new avatar URL
    return this.userRepository.save(user);
  }

  async findOne(idOrUsername: string | number): Promise<User> {
    const whereClause =
      typeof idOrUsername === 'number'
        ? { id: idOrUsername }
        : { username: idOrUsername };

    const user = await this.userRepository.findOne({
      where: whereClause,
      relations: ['friends', 'achievements', 'matchHistory'],
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID or username "${idOrUsername}" not found`,
      );
    }

    // Ensure the avatar is set
    if (!user.avatar && user.image?.link) {
      user.avatar = user.image.link;
    }

    console.log('Final user data:', user);
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

  async updateAchievements(
    userId: number,
    achievementIds: number[],
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['achievements'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const achievements =
      await this.achievementRepository.findByIds(achievementIds);

    if (achievements.length !== achievementIds.length) {
      throw new BadRequestException('Some achievements not found');
    }

    user.achievements = achievements;
    return this.userRepository.save(user);
  }

  async doesUserExist(identifier: string): Promise<boolean> {
    if (!identifier) {
      throw new Error('Identifier is required');
    }

    try {
      let user = await this.userRepository.findOneBy({ username: identifier });
      if (user) return true;

      user = await this.userRepository.findOneBy({ email: identifier });
      return !!user;
    } catch (error) {
      throw new Error('Error checking user existence');
    }
  }

  async createOrUpdateUser(userInfo: Partial<User>): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { intraId: userInfo.intraId },
    });

    if (user) {
      // user = { ...user, ...userInfo };
      console.log("User already exist in the database");
    } 
    else {
      user = this.userRepository.create(userInfo);
    }
    // console.log('User saved:', user);


    return this.userRepository.save(user);
  }

  async findOneById(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }
  
}

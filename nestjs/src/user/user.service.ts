import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Match } from '../match/match.entity';
import { CreateUserDto } from './dto/createUser.dto';
import * as fs from 'fs';
import * as path from 'path';
import { UserConversation } from '@/conversations/entities/conversation.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(UserConversation)
    private userConversationRepository: Repository<UserConversation>,
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

  async updateUser(id: string, updatedData: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: +id },
        relations: ['matchHistory', 'friends'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      const fieldsToUpdate: (keyof User)[] = [
        'wins',
        'loose',
        'ladder_level',
        'avatar',
      ];
      for (const field of fieldsToUpdate) {
        if (updatedData[field] !== undefined) {
          (user as Record<string, any>)[field] = updatedData[field];
        }
      }

      Object.assign(user, updatedData);
      return await this.userRepository.save(user);
    } catch (error) {
      console.error(`Error updating user with ID "${id}"`);
      // console.error(`Error updating user with ID "${id}":`, error);
      throw new InternalServerErrorException(
        'An error occurred while updating the user',
      );
    }
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: +id } });

    if (!user) throw new NotFoundException('User not found');

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
    await this.userRepository.update(user.id, { avatar: avatarUrl });
    return this.userRepository.findOne({ where: { id: user.id } });
  }

  async findOne(idOrUsername: string | number): Promise<User> {
    const whereClause =
      typeof idOrUsername === 'number'
        ? { id: idOrUsername }
        : { username: idOrUsername };

    const user = await this.userRepository.findOne({
      where: whereClause,
      relations: ['friends', 'matchHistory'],
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
      console.log('user already exist, not overwriting informations');
    } else {
      user = this.userRepository.create(userInfo);
    }
    console.log('User saved:', user);

    return this.userRepository.save(user);
  }

  async findOneById(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getUserIdByUsername(friendUsername: string): Promise<number | null> {
    const user = await this.userRepository.findOne({
      where: { username: friendUsername },
    });
    if (!user) {
      return null;
    }
    return user.id;
  }

  async getUsernameById(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['username'],
    });
    return user ? user.username : 'Unknown';
  }

  async incrementWins(userId: number) {
    console.log(`⚡ Incrementing WINS for User ID: ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      console.error('❌ User not found in database.');
      throw new NotFoundException('User not found');
    }

    user.wins += 1;
    console.log(`✅ New wins count: ${user.wins}`);
    await this.userRepository.save(user);
    return user;
  }

  async incrementLoose(userId: number) {
    console.log(`⚡ Incrementing LOSSES for User ID: ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      console.error('❌ User not found in database.');
      throw new NotFoundException('User not found');
    }

    user.loose += 1;
    console.log(`✅ New losses count: ${user.loose}`);
    await this.userRepository.save(user);
    return user;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/createUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Method to get all users
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  // Method to create a new user
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(newUser);
  }

  // Method to find one user by ID
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Method to remove a user by ID
  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
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
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Database } from './database.entity';
import { User } from '../user/user.entity';;

@Injectable()
export class DatabasesService {
  constructor(
    @InjectRepository(Database)
    private readonly databaseRepository: Repository<Database>,
	@InjectRepository(User)
	private readonly userRepository: Repository<User>,
  ) {}


  async findAll(): Promise<Database[]> {
    return this.databaseRepository.find();
  }

  async create(database: Database): Promise<Database> {
    return this.databaseRepository.save(database);
  }

  async findUserBySocketId(socketId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { socketId } });
  }

  async incrementWins(username: string) {
	const user = await this.userRepository.findOne({ where: { username } });
	if (!user) {
		console.error(`User ${username} not found!`);
		return;
	  }
	console.log(`Incrementing wins for ${username}`);
    return this.userRepository.increment({ username }, "wins", 1);
  }

  async incrementLosses(username: string) {
	const user = await this.userRepository.findOne({ where: { username } });
	if (!user) {
	  console.error(`User ${username} not found!`);
	  return;
	}
	console.log(`Incrementing loss for ${username}`);
    return this.userRepository.increment({ username }, "losses", 1);
  }
  }	

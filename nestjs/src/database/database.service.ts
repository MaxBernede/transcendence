import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Database } from './database.entity';

@Injectable()
export class DatabasesService {
	constructor(
		@InjectRepository(Database)
		private readonly databaseRepository: Repository<Database>,
	) {}

	async findAll(): Promise<Database[]> {
		return this.databaseRepository.find();
	}

	async create(database: Database): Promise<Database> {
		return this.databaseRepository.save(database);
	}
}

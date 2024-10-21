import { Controller, Get, Post, Body } from '@nestjs/common';
import { DatabasesService } from './database.service';
import { Database } from './database.entity';

@Controller('databases')
export class DatabasesController {
	constructor(private readonly databasesService: DatabasesService) {}

	@Get()
	async findAll(): Promise<Database[]> {
		// return [{ id: 1, name: 'John Doe', email: 't@test.com'}];
		return this.databasesService.findAll();
	}

	@Post()
	async create(@Body() database: Database): Promise<Database> {
		return this.databasesService.create(database);
	}
}

// base.controller.ts
import { Get, Post, Delete, Param, Body, Controller } from '@nestjs/common';
import { IBaseService } from './IBase.service';

export class BaseController<T> {
	constructor(public readonly service: IBaseService<T>) {}

	@Get()
	async findAll(): Promise<T[]> {
		return this.service.getAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: number): Promise<T> {
		return this.service.getOne(id);
	}

	@Post()
	async create(@Body() entity: T): Promise<T> {
		return this.service.create(entity);
	}

	@Delete(':id')
	async delete(@Param('id') id: number): Promise<void> {
		return this.service.delete(id);
	}
}

import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseEntity } from './base.entity.js';
import { IBaseService } from './IBase.service.js';

@Injectable()
export class BaseService<T> implements IBaseService<T> {
  constructor(private readonly repository: Repository<T>) {}

  async getAll(): Promise<T[]> {
    return this.repository.find();
  }

  async getOne(id: number): Promise<T> {
    return this.repository.findOneBy({ id } as any); // check if any doesnt break
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
  async update(entity: T): Promise<T> {
    await this.repository.save(entity);
    return entity;
  }

  public async create(entity: T): Promise<T> {
    const createdEntity = await this.repository.save(entity);
    return createdEntity;
  }
}

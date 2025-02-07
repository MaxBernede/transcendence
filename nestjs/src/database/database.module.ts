import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasesService } from './database.service';
import { Database } from './database.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Database, User]),
  	],
	providers: [DatabasesService],
 	exports: [DatabasesService],
  
})
export class DatabasesModule {}

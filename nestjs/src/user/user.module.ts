import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './user.service';
import { typeOrmConfig } from '../ormconfig';
import { UsersController } from './user.controller';
import { User } from './user.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot(typeOrmConfig),
		TypeOrmModule.forFeature([User]),
	],
	providers: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}

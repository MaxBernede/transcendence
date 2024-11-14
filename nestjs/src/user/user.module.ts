import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Registers the User entity
  ],
  providers: [UserService], // Provides the UserService
  controllers: [UserController], // Connects the UserController
  exports: [UserService], // Makes UserService available to other modules if needed
})
export class UsersModule {}

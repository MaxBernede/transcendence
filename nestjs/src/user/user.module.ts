import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import User entity
    MatchModule, // Import MatchModule if necessary
  ],
  controllers: [UserController],
  providers: [UserService], // Provide UserService
  exports: [UserService], // Export UserService for other modules
})
export class UsersModule {}

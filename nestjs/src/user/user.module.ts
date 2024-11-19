import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { MatchModule } from '../match/match.module';

@Module({
   imports: [
	   TypeOrmModule.forFeature([User]),
	   MatchModule, // Import MatchModule to access MatchService
	  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UsersModule {}

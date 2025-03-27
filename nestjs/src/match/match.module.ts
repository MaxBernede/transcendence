import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { User } from '@/user/user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Match, User])],
	controllers: [MatchController],
	providers: [MatchService],
	exports: [MatchService],
})
export class MatchModule {}

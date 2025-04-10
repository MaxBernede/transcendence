import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { User } from '@/user/user.entity';

@Injectable()
export class MatchService {
	constructor(
	  @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
	  @InjectRepository(User) private readonly userRepo: Repository<User>, // Inject the user repository
	) {}

	async createMatch(winnerId: number, looserId: number, winnerScore: number, looserScore: number) {
		const winner = await this.userRepo.findOne({ where: { id: winnerId } });
		const looser = await this.userRepo.findOne({ where: { id: looserId } });
	  
		if (!winner || !looser) {
		  throw new Error("Winner or looser not found");
		}
	  
		const match = this.matchRepo.create({
		  winner,
		  looser,
		  winnerScore,
		  looserScore,
		});
	  
		const savedMatch = await this.matchRepo.save(match);
	  
		winner.wins += 1;
		looser.loose += 1;
	  
		await this.userRepo.save([winner, looser]);
	  
		return savedMatch;
	  }
	  

	async getMatchesByUser(userId: number) {
		return this.matchRepo.find({
			where: [{ winner: { id: userId } }, { looser: { id: userId } }],
			relations: ['winner', 'looser'],
			select: {
				id: true,
				winnerScore: true,
				looserScore: true,
				date: true,
				winner: { id: true, username: true },
				looser: { id: true, username: true }
			}
		});
	}
}


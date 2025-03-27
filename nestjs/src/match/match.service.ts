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
		// Create the match
		const match = this.matchRepo.create({ 
			winner: { id: winnerId }, 
			looser: { id: looserId }, 
			winnerScore, 
			looserScore 
		});

		// Save the match
		const savedMatch = await this.matchRepo.save(match);

		// Fetch users
		const winner = await this.userRepo.findOne({ where: { id: winnerId } });
		const looser = await this.userRepo.findOne({ where: { id: looserId } });

		if (winner && looser) {
			// Increment wins and losses
			winner.wins += 1;
			looser.loose += 1;

			// Save updated users
			await this.userRepo.save(winner);
			await this.userRepo.save(looser);
		}

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

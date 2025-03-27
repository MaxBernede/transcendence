import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';

@Injectable()
export class MatchService {
	constructor(@InjectRepository(Match) private readonly matchRepo: Repository<Match>) {}

	async createMatch(winnerId: number, looserId: number, winnerScore: number, looserScore: number) {
		const match = this.matchRepo.create({ winner: { id: winnerId }, looser: { id: looserId }, winnerScore, looserScore });
		return this.matchRepo.save(match);
	}

	async getAllMatches() {
		return this.matchRepo.find({ relations: ['winner', 'looser'] });
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

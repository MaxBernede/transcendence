import { Controller, Post, Get, Body } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('matches')
export class MatchController {
	constructor(private readonly matchService: MatchService) {}

	@Post()
	async createMatch(@Body() body: { winnerId: number; looserId: number; winnerScore: number; looserScore: number }) {
		return this.matchService.createMatch(body.winnerId, body.looserId, body.winnerScore, body.looserScore);
	}

	@Get()
	async getAllMatches() {
		return this.matchService.getAllMatches();
	}
}

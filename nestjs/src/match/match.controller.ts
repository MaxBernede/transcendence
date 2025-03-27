import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MatchService } from './match.service';
import { BadRequestException } from '@nestjs/common';


// curl -X POST http://localhost:3000/matches -H "Content-Type: application/json" -d '{"winnerId":1, "looserId":2, "winnerScore":10, "looserScore":5}'
// curl -X GET http://localhost:3000/matches/1
@Controller('matches')
export class MatchController {
	constructor(private readonly matchService: MatchService) {}

	@Post()
	async createMatch(@Body() body: { winnerId: number; looserId: number; winnerScore: number; looserScore: number }) {
		return this.matchService.createMatch(body.winnerId, body.looserId, body.winnerScore, body.looserScore);
	}

	@Get(':userId')
	async getMatchesByUser(@Param('userId') userId: string) {
		const parsedId = parseInt(userId, 10);
		if (isNaN(parsedId)) {
			throw new BadRequestException("Invalid user ID");
		}
		return this.matchService.getMatchesByUser(Number(userId));
	}
}

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('user/:userId')
  async getMatchHistory(@Param('userId', ParseIntPipe) userId: number) {
    console.log(`Fetching match history for user ID: ${userId}`);

    const matchHistory = await this.matchService.findByUser(userId);

    if (!matchHistory || matchHistory.length === 0) {
      return { message: 'No match history available' };
    }

    return matchHistory.map((match) => ({
      description: `${match.type} vs ${match.opponent} - ${match.result} (${match.score})`,
      date: new Date(match.date).toLocaleDateString('en-GB'),
    }));
  }
}

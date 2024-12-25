import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { User } from '../user/user.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  // Retrieve match history by user ID
  async findByUser(userId: number) {
    return this.matchRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async updateMatchHistory(userId: number, matchUpdates: Partial<Match>[]): Promise<Match[]> {
    const matches = matchUpdates.map((matchData) => {
      return this.matchRepository.create({
        ...matchData,
        user: { id: userId } as User, // Link the match to the user
      });
    });

    return this.matchRepository.save(matches);
  }
}
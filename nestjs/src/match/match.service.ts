import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}
  
  async findByUser(userId: number) {
	return this.matchRepository.find({
	  where: { user: { id: userId } },
	  relations: ['user'],
	});
  }
  
}  

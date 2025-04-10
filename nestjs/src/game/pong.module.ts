import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { UsersModule } from '@/user/user.module';
import { MatchModule } from '@/match/match.module';

@Module({
  providers: [PongGateway, PongService],
  imports: [UsersModule, MatchModule],
  exports: [PongService, PongGateway],
})
export class PongModule {}

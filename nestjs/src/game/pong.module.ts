import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';

@Module({
  providers: [PongGateway, PongService],
  imports: [],
  exports: [PongService, PongGateway],
})
export class PongModule {}

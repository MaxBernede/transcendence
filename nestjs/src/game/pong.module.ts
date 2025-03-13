import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { DatabasesModule } from '../database/database.module';

@Module({
  providers: [PongGateway, PongService],
  imports: [DatabasesModule],
  exports: [PongService, PongGateway],
})
export class PongModule {}

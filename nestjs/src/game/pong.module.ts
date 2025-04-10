import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { UsersModule } from '@/user/user.module';

@Module({
  providers: [PongGateway, PongService],
  imports: [UsersModule],
  exports: [PongService, PongGateway],
})
export class PongModule {}

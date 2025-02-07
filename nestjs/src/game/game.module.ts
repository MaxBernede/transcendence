import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway'; 

@Module({
  providers: [PongGateway], 
  exports: [PongGateway],   
})
export class GameModule {}

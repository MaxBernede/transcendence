import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway'; 
import { DatabasesModule } from '../database/database.module';

@Module({
  providers: [PongGateway],
  imports: [DatabasesModule], 
  exports: [PongGateway],   
})
export class GameModule {}


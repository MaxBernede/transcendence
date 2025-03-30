import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PongService } from './pong.service';
import { CreatePongDto } from './dto/create_pong.dto';

@Controller('pong')
export class PongController {
  constructor(private readonly pongService: PongService) {}

//   @Post('create')
//   async createMatch(@Body() createPongDto: CreatePongDto) {
//     return await this.pongService.createMatch(createPongDto);
//   }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return await this.pongService.getRoomInfo(roomId);
  }

  @Get('user/:userId')
  async getUserRoom(@Param('userId') userId: number) {
    return await this.pongService.getRoomByUserId(userId);
  }
} 

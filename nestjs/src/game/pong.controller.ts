import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PongService } from './pong.service';
import { createInviteDto, CreatePongDto, JoinPrivateRoomDto } from './dto/create_pong.dto';
import { TokenPayload } from '@/auth/dto/token-payload';
import { GetUserPayload } from '@/test.decorator';

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

  @Get('join-invite/:roomId')
  async joinInviteRoom(
    @GetUserPayload() user: TokenPayload,
    @Param('roomId') roomId: string,
  ) {
    return await this.pongService.joinInviteRoom(user, roomId);
  }
  

  @Get('user/:userId')
  async getUserRoom(@Param('userId') userId: number) {
    return await this.pongService.getRoomByUserId(userId);
  }

  @Post('createInvite')
  async createInvite(
	@GetUserPayload() user: TokenPayload,
	@Body() data: createInviteDto,
  ) {
	return await this.pongService.createInvite(user, data);
  }

  @Post('join-room')
  async joinPrivateRoom(
	@GetUserPayload() user: TokenPayload,
	@Body() data: JoinPrivateRoomDto,
  ) {
	return await this.pongService.joinPrivateRoom(user, data);
  }

}

import { Controller, Get, Post, Body} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsEntity } from './entities/friends.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('addFriends')	
	async addFriends(@Body() body: { mainId: number, friendUsername: string, action: string}) {
		const { mainId, friendUsername, action } = body;
    return await this.friendsService.handleFriendAction(mainId, friendUsername, action);
	}

  @Get()
  async getAllFriends(): Promise<FriendsEntity[]> {
    return this.friendsService.findAll();
  }

  @Post()
  async createFriendship(@Body() createFriendDto: { mainUserId: number; secondUserId: number }): Promise<FriendsEntity> {
    return this.friendsService.create(createFriendDto);
  }
}


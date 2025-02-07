import { Controller, Delete, Get, Post, Body, Param} from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Post('acceptFriend/:id')
  async acceptFriend(@Param('id') id: number) {
    return await this.friendsService.addFriend(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('blockUser')	
	async blockUser(@Body() body: { mainId: number, friendUsername: string}) {
		const { mainId, friendUsername } = body;
    return await this.friendsService.handleBlocked(mainId, friendUsername);
	}

  @UseGuards(JwtAuthGuard)
  @Get('getFriends/:userId')	
	async getFriends(@Param('userId') userId: number) {
    return await this.friendsService.getFriendsByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('removeFriend/:id')
  async removeFriend(@Param('id') id: number) {
    return await this.friendsService.removeFriend(id);
  }

}


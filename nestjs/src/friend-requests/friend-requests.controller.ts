import {
  BadRequestException,
  Controller,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FriendRequestsService } from './friend-requests.service';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { users } from 'src/db/schema';

@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private friendRequestsService: FriendRequestsService) {}

  @UseGuards(JwtGuard)
  @Post('/send/:username')
  sendFriendRequest(@Param('username') username: string, @GetUser() user: any) {
    const senderUsername: string = user.username;
    if (username === senderUsername) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }
    console.log('username', username);
    return this.friendRequestsService.sendFriendRequest(
      username,
      user.username,
    );
  }

  @UseGuards(JwtGuard)
  @Post('/accept/:username')
  acceptFriendRequests(
    @Param('username') username: string,
    @GetUser() user: any,
  ) {
    return this.friendRequestsService.acceptFriendRequests(
      username,
      user.username,
    );
  }

  @UseGuards(JwtGuard)
  @Post('/decline/:username')
  declineFriendRequests(
	@Param('username') username: string,
	@GetUser() user: any,
  ) {
	return this.friendRequestsService.declineFriendRequests(
	  username,
	  user.username,
	);
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { users } from 'src/db/schema';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
	constructor(private userService: UserService) {}
	// database lookup happens in the JwtGuard
	@UseGuards(JwtGuard)
	@Get('me')
	getMe(@GetUser() user: typeof users) {
		console.log('User:', user);
		return user;
	}

	@UseGuards(JwtGuard)
	@Get('me/friends')
	getMyFriends(@GetUser() user: any) {
		return this.userService.getMyFriends(user.username);
	}

	@Get(':username')
	getUser(@Param('username') username: string) {
		return this.userService.getUser(username);
	}

}

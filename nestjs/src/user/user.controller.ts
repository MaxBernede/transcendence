import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { users } from 'src/db/schema';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
	constructor(private userService: UserService) {}

	@Get(':username')
	getUser(@Param('username') username: string) {
		return this.userService.getUser(username);
	}

	@UseGuards(JwtGuard)
	@Get('me')
	getMe(@GetUser() user: typeof users) {
		return user;
	}
}

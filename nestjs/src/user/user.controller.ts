import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { users } from 'src/db/schema';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
	@Get('me')
	getMe(@GetUser() user: typeof users) {
		return user;
	}
}

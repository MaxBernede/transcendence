import { Controller, Get, UseGuards } from '@nestjs/common';
import { user } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
	@Get('me')
	getMe(@GetUser() user: user) {
		return user;
	}
}

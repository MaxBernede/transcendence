
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
	private usersService: UsersService,
	private jwtService: JwtService
) {}

  async signIn(
	username: string,
	pass: string
	): Promise< {access_token: string}> {
	const user = await this.usersService.findOneByUsername(username); 
	if (user?.password !== pass) {
		throw new UnauthorizedException();
	}
	const payload = {
		id: user.id,  // user ID
		username: user.username,  // username
		email: user.email,  // email (you can include any other fields as well)
		wins: user.wins,  // wins
		loose: user.loose,  // loose
		ladder_level: user.ladder_level,  // ladder level
		activity_status: user.activity_status,  // activity status
	  };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
	}
}


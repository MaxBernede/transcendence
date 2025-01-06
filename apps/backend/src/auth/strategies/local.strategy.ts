import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      password: 'password',
    });
	console.log('LocalStrategy constructor');
  }

  // anything validate returns is added the the users request object
  async validate(username: string, password: string) {
    console.log('username:', username);
    console.log('password:', password);
    return this.authService.verifyUser(username, password);
  }
}

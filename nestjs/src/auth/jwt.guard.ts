import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      // Log the error information (this could be any kind of failure, like token expired, invalid, etc.)
      if (info) {
        console.error('JWT Auth failed:', info.message);
      }
      // Throw an UnauthorizedException to signal the authentication failure
	  throw new UnauthorizedException('Authentication failed');
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}

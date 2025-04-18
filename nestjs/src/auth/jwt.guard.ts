import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      console.error('JWT Auth failed:', {
        error: info?.message,
        authHeader: request.headers['authorization'],
      });
      throw new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}


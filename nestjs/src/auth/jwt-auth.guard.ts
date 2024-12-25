import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('Authorization Header:', authHeader);

    if (!authHeader) {
      console.error('Authorization header is missing');
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.error('Bearer token is missing in Authorization header');
      throw new UnauthorizedException('Token is missing');
    }

    try {
      // Validate the token
      const user = await this.jwtService.verifyAsync(token);
      console.log('Decoded Token:', user);

      // Attach the user to the request object
      request.user = user;
      return true;
    } catch (error) {
      console.error('Token validation failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

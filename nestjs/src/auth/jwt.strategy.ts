import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { TokenPayload } from './dto/token-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // First, try to get the JWT from Authorization header
          const authHeader = request?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }

          // If not found, fallback to cookies
          return request?.cookies?.jwt || null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
    console.log('JwtStrategy initialized');
  }

  async validate(payload: TokenPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload; // Attach user payload to the request object
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from './dto/token-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          console.log('Incoming cookies:', request?.cookies);

          return request?.cookies?.jwt || null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
    console.log('JwtStrategy initialized');
  }

  async validate(payload: TokenPayload) {
    console.log('Validated payload:', payload);
    return payload; // Attach user payload to the request object
  }
}

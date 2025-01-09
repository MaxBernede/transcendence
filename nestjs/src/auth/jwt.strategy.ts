// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { UserService } from '../user/user.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(
//     private readonly configService: ConfigService,
//     private readonly userService: UserService,
//   ) {
//     // Extract the JWT_SECRET from the config service
//     // const secret = configService.get<string>('JWT_SECRET');
// 	const secret = configService.getOrThrow<string>('JWT_SECRET');
//     if (!secret) {
//       console.warn('JWT_SECRET is not defined. Using fallback secret!');
//     }

//     // Pass strategy configuration to the parent class
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header
//       ignoreExpiration: false, // Ensures JWT expiration is validated
//       secretOrKey: secret || 'fallbackSecret', // Fallback secret in case of missing env variable
//     });

//     console.log('JWT_SECRET in JwtStrategy:', secret); // Debug log for the secret
//   }

//   async validate(payload: any) {
//     console.log('Decoded JWT Payload:', payload);

//     if (!payload || !payload.sub) {
//       console.error('Invalid JWT payload:', payload);
//       throw new UnauthorizedException('Invalid token payload');
//     }

//     // Validate user based on payload.sub (assumed to be the user ID)
//     const user = await this.userService.findOne(payload.sub);

//     if (!user) {
//       console.error('User not found for token:', payload);
//       throw new UnauthorizedException('User not found');
//     }

//     console.log('User validated successfully:', user);
//     return user; // Attach the validated user to the request object
//   }
// }

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
          // Log cookies
          // console.log('Incoming cookies:', request?.cookies);

          // Extract token from cookies
          return request?.cookies?.jwt || null;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
    console.log('JwtStrategy initialized');
  }

  async validate(payload: TokenPayload) {
    // console.log('Validated payload:', payload);
    return payload; // Attach user payload to the request object
  }
}

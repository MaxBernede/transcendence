// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { UserService } from '../user/user.service';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     private readonly configService: ConfigService,
//     private readonly userService: UserService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: configService.get<string>('JWT_SECRET'),
//     });
//   }

//   async validate(payload: any) {
//     console.log('Decoded JWT Payload:', payload);

//     if (!payload || !payload.sub) {
//       console.error('Invalid JWT payload:', payload);
//       throw new UnauthorizedException('Invalid token payload');
//     }

//     const user = await this.userService.findOneById(payload.sub);

//     if (!user) {
//       console.error('User not found for token:', payload);
//       throw new UnauthorizedException('User not found');
//     }

//     console.log('User validated successfully:', user);
//     return user;
//   }
// }

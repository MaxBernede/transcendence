import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TRPCError } from '@trpc/server';
import {
  MiddlewareOptions,
  TRPCMiddleware,
} from 'nestjs-trpc';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategyMiddleware implements TRPCMiddleware {
  private readonly jwtSecret: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
  }

  async use(opts: MiddlewareOptions<any>) {
    const { req, res } = opts.ctx;

    const token = req.cookies['Authentication'];

    if (!token) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Missing token' });
    }

    console.log('token:', token);

    let payload: TokenPayload;
    try {
      console.log('secret', this.jwtSecret);
      payload = this.jwtService.verify(token, {
        secret: this.jwtSecret,
      });
    } catch (error: any) {
      console.error('Token validation failed:', error.message);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    const user = await this.usersService.getUserById(parseInt(payload.userId));

    return opts.next({
      ctx: {
        auth: {
          userId: user.id,
          username: user.username,
        },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/users.schema';
import { Response } from 'express';
import z from 'zod';
import exp from 'constants';
import { TRPCError } from '@trpc/server';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: User, response: Response) {
    console.log('login user:', user);
    // console.log('response:', response);
    const secret = this.configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
    const expires = this.configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_EXPIRATION_MS',
    );
    const expiresAccessToken = new Date();
    expiresAccessToken.setMilliseconds(
      expiresAccessToken.getTime() + parseInt(expires),
    );

    // const payload = z.object({
    //   id: z.string(),
    //   username: z.string(),
    // });

    const payload: TokenPayload = {
      userId: user.id.toString(),
      username: user.username,
    };

    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: secret,
        expiresIn: expires + 'ms',
      });
    } catch (e) {
      console.log('error:', e);
    }
    const accessToken = this.jwtService.sign(payload, {
      secret: secret,
      expiresIn: expires + 'ms',
    });
    console.log('user login 1');

    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresAccessToken,
    });

    console.log('Response headers:', response.getHeaders());
  }

  async verifyUser(username: string, password: string) {
    // console.log('username:', username);
    // console.log('password:', password);

    const user = await this.usersService.getUserByUsername(username);
    console.log('verifyUser user:', user);

    const isPasswordValid = await argon.verify(user.password, password);
    if (!isPasswordValid) {
      throw new TRPCError({
        message: 'verifyUser: Invalid password',
        code: 'BAD_REQUEST',
      });
    }
    delete user.password;
    return user;
  }
}

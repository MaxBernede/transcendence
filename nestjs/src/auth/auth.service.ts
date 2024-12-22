import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto';
import * as argon from 'argon2';

import { DrizzleService } from 'src/drizzle/drizzle.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

import * as Identicon from 'identicon.js';
import * as fs from 'fs';

import * as crypto from 'crypto';

import { CreateUserDto } from 'src/db/dto';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private readonly config: ConfigService,
    private drizzle: DrizzleService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);

	//   const usernameHash = crypto.createHash('sha256').update(dto.username).digest('hex');;
	//   const identiconImage = new Identicon(usernameHash, 256).toString();

	//   fs.writeFileSync('./uploads/identicon.png', identiconImage, { encoding: 'base64' });

	  const userToInsert: CreateUserDto = {
		username: dto.username,
		password: hash,
		avatarUrl: 'http://localhost:3000/identicon.png'
	  };

      const user = await this.drizzle
        .getDb()
        .insert(users)
		.values(userToInsert)
        .returning();
      const insertedUser = user[0];

      return this.signToken(insertedUser.id, insertedUser.username);
    } catch (error) {
      if (error.code === '23505') {
        throw new ForbiddenException('User already exists');
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    const user = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, dto.username))
      .limit(1);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const foundUser = user[0];

    const isPasswordValid = await argon.verify(
      foundUser.password,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.signToken(foundUser.id, foundUser.username);
  }

  async signToken(
    userId: number,
    username: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      username: username,
    };

    const secret = this.config.get<string>('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });
    return { access_token: token };
  }
}

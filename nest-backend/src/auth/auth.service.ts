import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto, LoginDto, NewUserDto } from './dto';
import * as argon from 'argon2';

import * as schema from 'schema/schema';

import { DATABASE_CONENCTION } from 'src/database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { dlopen } from 'process';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONENCTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(user: AuthDto) {
    // user: typeof schema.users.$inferInsert
    console.log(user);
    // console.log(typeof schema.users.$inferInsert);
    const hash = await argon.hash(user.password);
	console.log(hash);

    const userToInsert: NewUserDto = {
      username: user.username,
      password: hash,
      avatarUrl: 'https://avatars.githubusercontent.com/u/124260839?v=4',
    };

    try {
      const insertedUser = await this.db
        .insert(schema.users)
        .values(userToInsert)
        .returning();

      return { message: 'Signup successful. Please log in to continue.' };
      return insertedUser;
    } catch (e) {
      if (e && e.code === '23505') {
        throw new ForbiddenException('User already exists');
      }
      console.log(e);
      return e;
    }
  }

  async signin(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, dto.username),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(user);

    const isPasswordValid = await argon.verify(user.password, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id);
  }

  async signToken(userId: number): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
    };

    const secret = this.config.get<string>('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '365d', // 1 year for development purposes only
      secret: secret,
    });
    return { access_token: token };
  }

  //   const userToInsert: CreateUserDto = {
  //     username: dto.username,
  //     password: hash,
  //     avatarUrl: 'http://localhost:3000/identicon.png',
  //   };

  //   const user = await this.drizzle
  //     .getDb()
  //     .insert(users)
  //     .values(userToInsert)
  //     .returning();
  //   const insertedUser = user[0];

  //   //   return this.signToken(insertedUser.id, insertedUser.username);
  //   return { message: 'Signup successful. Please log in to continue.' };
  // } catch (error) {
  //   if (error.code === '23505') {
  //     throw new ForbiddenException('User already exists');
  //   }
  //   throw error;
  // }
  //   }

  //   async signin(dto: AuthDto) {
  //     const user = await this.drizzle
  //       .getDb()
  //       .select()
  //       .from(users)
  //       .where(eq(users.username, dto.username))
  //       .limit(1);
  //     if (!user || user.length === 0) {
  //       throw new UnauthorizedException('Invalid credentials');
  //     }
  //     const foundUser = user[0];

  //     const isPasswordValid = await argon.verify(
  //       foundUser.password,
  //       dto.password,
  //     );
  //     if (!isPasswordValid) {
  //       throw new UnauthorizedException('Invalid credentials');
  //     }
  //     return this.signToken(foundUser.id, foundUser.username);
  //   }

  //   async signToken(
  //     userId: number,
  //     username: string,
  //   ): Promise<{ access_token: string }> {
  //     const payload = {
  //       sub: userId,
  //       username: username,
  //     };

  //     const secret = this.config.get<string>('JWT_SECRET');
  //     const token = await this.jwt.signAsync(payload, {
  //       expiresIn: '365d', // 1 year for development purposes only
  //       secret: secret,
  //     });
  //     return { access_token: token };
  //   }
}

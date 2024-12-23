import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { users } from 'src/db/schema';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { eq } from 'drizzle-orm';
import { UUID } from 'crypto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private drizzle: DrizzleService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: UUID; username: string }) {
	console.log('Payload:', payload);
    const user = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .execute();

    delete user[0].password;
    return user[0];
  }
}

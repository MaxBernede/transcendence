import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { DATABASE_CONENCTION } from 'src/database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from 'schema/schema';
import { JWTPayloadDto } from '../dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @Inject(DATABASE_CONENCTION)
    private readonly db: NodePgDatabase<typeof schema>,
    // private drizzle: DrizzleService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JWTPayloadDto) {
    console.log('Payload:', payload);
    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, payload.sub),
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    delete user.password;
    return user;
  }
}

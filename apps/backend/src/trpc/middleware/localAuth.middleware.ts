import { Inject, Injectable, Logger } from '@nestjs/common';
import { MiddlewareOptions, TRPCMiddleware } from 'nestjs-trpc';
import {
  IAppContext,
  IAuthMiddlewareContext,
} from '../context/context.interface';
import { TRPCError } from '@trpc/server';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';

@Injectable()
export class LocalAuthMiddleware implements TRPCMiddleware {
  constructor(
    @Inject(LocalStrategy)
    private readonly localStrategy: LocalStrategy,
  ) {}

  async use(opts: MiddlewareOptions<IAuthMiddlewareContext>) {
    console.log('LocalAuthMiddleware');
    // console.log('opts:', opts);
    const { path, type, next, ctx } = opts;
    const { req, res } = opts.ctx;

    if (Array.isArray(req.body) && req.body.length > 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Batching is not supported',
      });
    }

    const auth = req.body?.['0'];
    if (!auth || !auth.username || !auth.password) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Username and password are required',
      });
    }
    console.log('trpc auth:', auth);

    const { username, password } = auth;
    const user = await this.localStrategy.validate(username, password);
    console.log('user:', user);
    return next({
      ctx: {
        auth: {
          userId: user.id,
          username: user.username,
        },
      },
    });
  }
}

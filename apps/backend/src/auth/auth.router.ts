import {
  Input,
  Mutation,
  Query,
  Router,
  UseMiddlewares,
  Ctx,
} from 'nestjs-trpc';
import { LoggerMiddleware } from 'src/trpc/middleware/logger.middleware';

import { z } from 'zod';
import { AuthService } from './auth.service';
import { Res, UseGuards } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { type User } from 'src/users/users.schema';
import { type Response } from 'express';
import { LocalAuthMiddleware } from 'src/trpc/middleware/localAuth.middleware';
import type { AuthMiddlewareContext } from 'src/trpc/context/app.context';
import { TRPCError } from '@trpc/server';

@Router({ alias: 'auth' })
@UseMiddlewares(LoggerMiddleware)
export class AuthRouter {
  constructor(private readonly authService: AuthService) {}

  @Mutation({
    input: z.object({
      username: z.string().nonempty(),
      password: z.string().nonempty(),
    }),
    output: z.object({
		message: z.string().nonempty(),
	}),
  })
  @UseMiddlewares(LocalAuthMiddleware)
  //   async login(@Ctx() ctx: any, @Res({ passthrough: true }) response: Response) {
  async login(@Ctx() ctx: any) {
    console.log('login ctx:');
    const { userId, username } = ctx.auth || {};
    if (!userId || !username) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR', // or another appropriate error code
        message:
          'login: An unexpected error occurred while retrieving user information',
      });
    }
    // console.log('login userId:', userId);
    // console.log('login username:', username);
    const response: Response = ctx.res;
    // console.log('res:', response);
    await this.authService.login({ id: userId, username }, response);

    return {
		message: 'Login successful',
	};
  }
}

import {
  Ctx,
  Input,
  Mutation,
  Query,
  Router,
  UseMiddlewares,
} from 'nestjs-trpc';
import { LoggerMiddleware } from 'src/trpc/middleware/logger.middleware';
import { UsersService } from './users.service';
import { createUsersSchema, usersSchema } from './users.schema';
import type { CreateUser } from './users.schema';
import { z } from 'zod';
import { JwtStrategyMiddleware } from 'src/trpc/middleware/jwt-strategy.middleware';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { IsNumber } from 'class-validator';

@Router({ alias: 'users' })
@UseMiddlewares(LoggerMiddleware)
export class UsersRouter {
  constructor(private readonly usersService: UsersService) {}

  @Query({
    input: z.object({ id: z.string().nonempty() }),
    output: usersSchema,
  })
  @UseMiddlewares(JwtStrategyMiddleware)
  getUserById(@Ctx() ctx: any, @Input('id') id: number) {
    // const { userId, username } = ctx.auth || {};
    console.log('getUserById user:', ctx.auth);
    return this.usersService.getUserById(id);
  }

  @Query({
    output: usersSchema,
  })
  @UseMiddlewares(JwtStrategyMiddleware)
  getUsersMe(@Ctx() ctx: any) {
    return this.usersService.getUserById(ctx.auth.userId);
  }

  @Query({
    input: z.object({ username: z.string().nonempty() }),
    output: usersSchema,
  })
  getUserByUsername(@Input('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @Mutation({
    input: createUsersSchema,
    output: usersSchema,
  })
  createUser(@Input() userData: CreateUser) {
    return this.usersService.createUser(userData);
  }
}

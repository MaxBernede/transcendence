import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONENCTION } from 'src/database/database-connection';
import * as schema from 'src/schema/schema';
import { CreateUser, User } from './users.schema';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import * as argon from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONENCTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getUserById(id: number) {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, id),
    });
    if (!user) {
      throw new TRPCError({
        message: 'getUserById: User not found',
        code: 'NOT_FOUND',
      });
    }
	// console.log('user:', user);
    return user;
  }

  async getUserByUsername(username: string) {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.username, username),
    });
    if (!user) {
      throw new TRPCError({
        message: 'getUserByUsername: User not found',
        code: 'NOT_FOUND',
      });
    }
    return user;
  }

  //   async createUser(userData: Users) {
  //     return userData;
  //   }
  async createUser(userData: CreateUser) {
    type NewUser = typeof schema.users.$inferInsert;
    const insertUser = async (user: NewUser) => {
      return this.db.insert(schema.users).values(user).returning();
    };
	const passwordHash = await argon.hash(userData.password);
    const newUser: NewUser = {
      username: userData.username,
      password: passwordHash,
    };

    try {
      const insertedUser = await insertUser(newUser);
      console.log('insertedUser:', insertedUser);
      const returnUser: User = {
        id: insertedUser[0].id,
        username: insertedUser[0].username,
      };
      return returnUser;
      //   return userData;
    } catch (e: any) {
      //   if (e.code === '23505') {
      if (e.code === '23505') {
        throw new TRPCError({
          message: 'Username already exists',
          code: 'BAD_REQUEST',
        });
      }
      console.log('Unexpected error:', e);
      throw new TRPCError({
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR', // Use 'INTERNAL_SERVER_ERROR' code for 500 errors
      });
    }

    return userData;
  }
}

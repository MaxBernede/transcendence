import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONENCTION } from 'src/database/database-connection';
import * as schema from 'schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { getFriends } from './dto/get-friends';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONENCTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getUsers() {
    return this.db.query.users.findMany();
  }

  async createUser(user: typeof schema.users.$inferInsert) {
    console.log(user);
    const u = await this.db.insert(schema.users).values(user).returning();

    console.log(u);
    return u;
  }

  async addFriend(user: typeof schema.friends.$inferInsert) {
    console.log(user);

    try {
      await this.db.insert(schema.friends).values(user);
    } catch (e) {
      if (e.message.includes('user_id_1 < user_id_2')) {
        try {
          await this.db.insert(schema.friends).values({
            userId1: user.userId2,
            userId2: user.userId1,
          });
        } catch (e) {
          if (e.message.includes('friends_user_id_1_user_id_2_unique')) {
            throw new BadRequestException('Friendship already exists');
          }
        }
      } else if (e.message.includes('user_id1 === userid_2')) {
        throw new BadRequestException('Cannot add yourself as a friend');
      } else if (e.message.includes('friends_user_id_1_user_id_2_unique')) {
        throw new BadRequestException('Friendship already exists');
      }
    }
    return 'Friend added';
  }

  async getFriends(userId: getFriends) {
    console.log(userId);

    // const f = this.db.query.friends.findMany({
    //   where: (friends, { or, eq }) =>
    //     or(
    //       eq(friends.userId1, userId.userId),
    //       eq(friends.userId2, userId.userId),
    //     ),
    // });
    // const transformed = (await f).map(({ id, ...rest }) => rest);

    const friendsList = await this.db.execute(sql`
			SELECT CASE
					 WHEN user_id_1 = ${userId.userId} THEN user_id_2
					 ELSE user_id_1
				   END AS friend_id
			FROM friends
			WHERE user_id_1 = ${userId.userId} OR user_id_2 = ${userId.userId}
			`);

    console.log(friendsList.rows);

    return friendsList.rows;
  }

  async getMyFriends(userId: number) {
    console.log(userId);
    const friendsList = await this.db.execute(sql`
		SELECT DISTINCT
		  CASE
			WHEN user_id_1 = ${userId} THEN user_id_2
			ELSE user_id_1
		  END AS friend_id,
		  u.username
		FROM friends f
		JOIN users u
		  ON (u.id = f.user_id_1 OR u.id = f.user_id_2)
		WHERE (f.user_id_1 = ${userId} OR f.user_id_2 = ${userId})
		AND u.id != ${userId}
	  `);

    console.log(friendsList.rows);
	return friendsList.rows;
  }

  async getUserByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: (users) => eq(users.username, username),
    });
  }
}

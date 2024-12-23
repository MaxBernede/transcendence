import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { friends, users } from 'src/db/schema';
import { eq, or } from 'drizzle-orm';
import { NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer'; // Import the class-transformer
import { UserPublicDto } from './dto';

@Injectable()
export class UserService {
  constructor(private drizzle: DrizzleService) {}

  async getUser(username: string) {
    const user = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || user.length === 0) {
      throw new NotFoundException('User not found');
    }

    // return user[0];
    return plainToClass(UserPublicDto, user[0], {
      excludeExtraneousValues: true, // Exclude fields that are not in the DTO (e.g., password)
    });
  }

  async getMyFriends(username: string) {
	return "getMyFriends";
    const user = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || user.length === 0) {
      throw new NotFoundException('User not found');
    }

    // Fetch the friend relationships (both directions)
    //     const friendsList = await this.drizzle
    //   .getDb()
    //   .select()
    //   .from(friends)
    //   .whereRaw(`"userId1" = ? OR "userId2" = ?`, [user[0].id, user[0].id]);

    // console.log('friendsList', friendsList);

    // await this.drizzle
    //   .getDb2()
    //   .query.users.findMany({ where: { id: { in: [1, 2] } } });

	const p = await this.drizzle.getDb2().query.friends.findMany();
	console.log('p', p);

    // Now map through the friend relationships to get actual friend IDs
    // const friendIds = friendsList.map((friend) =>
    //   friend.userId1 === user[0].id ? friend.userId2 : friend.userId1,
    // );

    // // Fetch the actual user data for the friend IDs
    // const myFriends = await this.drizzle
    //   .getDb()
    //   .select()
    //   .from(users)
    //   .whereIn(users.id, friendIds);

    // return myFriends; // Return the friend details (e.g., usernames, avatars, etc.)
  }
}

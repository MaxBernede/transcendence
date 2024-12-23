import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { send } from 'process';
import { friendRequests, friends, users } from 'src/db/schema';
import { DrizzleService } from 'src/drizzle/drizzle.service';

@Injectable()
export class FriendRequestsService {
  constructor(private drizzle: DrizzleService) {}

  async sendFriendRequest(username: string, senderUsername: string) {
    if (!username) {
      return { statusCode: 400, error: 'Username is required' };
    }

    if (senderUsername === username) {
      return {
        statusCode: 400,
        error: 'You cannot send a friend request to yourself',
      };
    }

    const targetUser = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (!targetUser || targetUser.length === 0) {
      return { statusCode: 404, error: 'User not found' };
    }

    const senderUser = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, senderUsername))
      .limit(1);
    if (!senderUser || senderUser.length === 0) {
      return { statusCode: 404, error: 'Sender not found' };
    }

    const existingFriendRequests = await this.drizzle
      .getDb()
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.senderId, senderUser[0].id))
      .where(eq(friendRequests.receiverId, targetUser[0].id))
      .limit(1);
    if (existingFriendRequests && existingFriendRequests.length > 0) {
      return { statusCode: 400, error: 'Friend request already sent' };
    }

    const l = await this.drizzle
      .getDb()
      .insert(friendRequests)
      .values({
        senderId: senderUser[0].id,
        receiverId: targetUser[0].id,
      })
      .execute();

    console.log('l:', l);

    return 'Friend request sent';
  }

  async acceptFriendRequests(username: string, senderUsername: string) {
    if (username === senderUsername) {
      throw new BadRequestException(
        'You cannot accept a friend request from yourself',
      );
    }

    const senderUser = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, senderUsername))
      .limit(1);

    if (senderUser.length === 0) {
      throw new NotFoundException('Sender not found');
    }

    const targetUser = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    // Check if user exists
    if (targetUser.length === 0) {
      throw new NotFoundException('User not found');
    }

    const friendRequest = await this.drizzle
      .getDb()
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.senderId, senderUser[0].id))
      .where(eq(friendRequests.receiverId, targetUser[0].id))
      .where(eq(friendRequests.status, 'pending'))
      .limit(1);

    console.log('friendRequest:', friendRequest);

    if (friendRequest.length === 0) {
      throw new NotFoundException('Friend request not found');
    }

    // Check if users are already friends
    const existingFriendship = await this.drizzle
      .getDb()
      .select()
      .from(friends)
      .where(
        or(
          and(
            eq(friends.userId1, senderUser[0].id),
            eq(friends.userId2, targetUser[0].id),
          ),
          and(
            eq(friends.userId1, targetUser[0].id),
            eq(friends.userId2, senderUser[0].id),
          ),
        ),
      )
      .limit(1);

    if (existingFriendship.length > 0) {
      throw new BadRequestException('Users are already friends');
    }

    await this.drizzle
      .getDb()
      .update(friendRequests)
      .set({ status: 'accepted' })
      .where(eq(friendRequests.senderId, senderUser[0].id))
      .where(eq(friendRequests.receiverId, targetUser[0].id))
      .execute();

    await this.drizzle
      .getDb()
      .insert(friends)
      .values({ userId1: senderUser[0].id, userId2: targetUser[0].id })
      .execute();

    return 'Friend request accepted';
  }

  async declineFriendRequests(username: string, senderUsername: string) {
    if (username === senderUsername) {
      throw new BadRequestException(
        'You cannot decline a friend request from yourself',
      );
    }

    const senderUser = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, senderUsername))
      .limit(1);

    if (senderUser.length === 0) {
      throw new NotFoundException('Sender not found');
    }

    const targetUser = await this.drizzle
      .getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    // Check if user exists
    if (targetUser.length === 0) {
      throw new NotFoundException('User not found');
    }

    const friendRequest = await this.drizzle
      .getDb()
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.senderId, senderUser[0].id))
      .where(eq(friendRequests.receiverId, targetUser[0].id))
      .where(eq(friendRequests.status, 'pending'))
      .limit(1);

    console.log('friendRequest:', friendRequest);

    if (friendRequest.length === 0) {
      throw new NotFoundException('Friend request not found');
    }

    await this.drizzle
      .getDb()
      .update(friendRequests)
      .set({ status: 'declined' })
      .where(eq(friendRequests.senderId, senderUser[0].id))
      .where(eq(friendRequests.receiverId, targetUser[0].id))
      .execute();

    return 'Friend request declined';
  }
}

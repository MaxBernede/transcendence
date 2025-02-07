import { Injectable, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendsEntity } from './entities/friends.entity';
import { UserService } from 'src/user/user.service';
import { FriendData, RequestData, FriendsResponse } from './entities/friends.interface';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendsEntity)
    private friendsRepository: Repository<FriendsEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  async findAll(): Promise<FriendsEntity[]> {
    console.log("Find All")
    return this.friendsRepository.find();
  }

  async create(createFriendDto: { mainUserId: number; secondUserId: number }): Promise<FriendsEntity> {
    const friend = this.friendsRepository.create(createFriendDto);
    return this.friendsRepository.save(friend);
  }


  ///  TEN ETAIT LA MEC TU DOIS CODER LA FRIEND LOGIC

  async handleFriendAction(mainId: number, friendUsername: string, action: string) {

    const friendId = await this.userService.getUserIdByUsername(friendUsername)
    if (!friendId) throw new ConflictException('Friend username not found');
    if (friendId === mainId) throw new ConflictException('Cannot add yourself as friend');
    if (!['request', 'friends', 'blocked'].includes(action)) throw new ConflictException('Invalid action')

    // Check if the users already have a relationship (friendship, request, or blocked)
    const existingRelationship = await this.friendsRepository.findOne({
      where: [
        { mainUserId: mainId, secondUserId: friendId },
        { mainUserId: friendId, secondUserId: mainId },
      ],
    });

    if (existingRelationship) {

      // leave without doingn anything
      if (existingRelationship.status === 'blocked' && existingRelationship.mainUserId !== mainId) {
        return { message: 'You have been blocked by this user', status: 'ok' };
      }

      // If the relationship already exists, check the status
      if (existingRelationship.status === 'friends' && action === 'request') {
        throw new ConflictException('You are already friends with this user');
      }
      if (existingRelationship.status === 'blocked' && action === 'friends') {
        throw new ConflictException('This user is blocked');
      }
      // Update status if necessary (e.g., from "request" to "friends" or "blocked")
      existingRelationship.status = action;
      await this.friendsRepository.save(existingRelationship);
      return existingRelationship;
    } else {
      // If no relationship exists, create a new one
      const newFriend = this.friendsRepository.create({
        mainUserId: mainId,
        secondUserId: friendId,
        status: action,
      });
      return await this.friendsRepository.save(newFriend);
    }
  }
  
  async handleBlocked(mainId: number, friendUsername: string) {
    const userId = await this.userService.getUserIdByUsername(friendUsername);
    if (!userId) throw new ConflictException('Friend username not found');
  
    if (userId === mainId) throw new ConflictException('Cannot block yourself');
  
    // Check if there's an existing relationship (friends, request, or blocked)
    const existingRelationship = await this.friendsRepository.findOne({
      where: [
        { mainUserId: mainId, secondUserId: userId },
        { mainUserId: userId, secondUserId: mainId },
      ],
    });
  
    if (existingRelationship) {
      // If already blocked, do nothing
      if (existingRelationship.status === 'blocked') {
        throw new ConflictException('This user is already blocked');
      }
  
      // Update status to 'blocked'
      existingRelationship.status = 'blocked';
      await this.friendsRepository.save(existingRelationship);
      return existingRelationship;
    } else {
      // If no relationship exists, create a new blocked relationship
      const newBlocked = this.friendsRepository.create({
        mainUserId: mainId,
        secondUserId: userId,
        status: 'blocked',
      });
      return await this.friendsRepository.save(newBlocked);
    }
  }


  // Gives all the friends info needed
  async getFriendsByUserId(userId: number): Promise<FriendsResponse> {
    // Fetch data from the database based on the status
    const friends = await this.friendsRepository.find({
      where: { mainUserId: userId, status: 'friends' },
    });
  
    const requests = await this.friendsRepository.find({
      where: { mainUserId: userId, status: 'request' },
    });
  
    const requested = await this.friendsRepository.find({
      where: { secondUserId: userId, status: 'request' },
    });
  
    const blocked = await this.friendsRepository.find({
      where: { mainUserId: userId, status: 'blocked' },
    });

    // Function to add the username and structure the data for friends and blocked
    const addUsername = async (entries: FriendsEntity[], isMainUser: boolean): Promise<FriendData[]> => {
      return Promise.all(entries.map(async (entry) => {
        const userId = isMainUser ? entry.secondUserId : entry.mainUserId;
        const username = await this.userService.getUsernameById(userId);
        return { id: entry.id, username, status: entry.status } as FriendData;
      }));
    };

    // Fetch usernames for requests and requested entries before combining
    const addRequestUsernames = async (requests: FriendsEntity[], requested: FriendsEntity[]): Promise<RequestData[]> => {
      const sentRequests = await Promise.all(
        requests.map(async (entry) => {
          const username = await this.userService.getUsernameById(entry.secondUserId); // Sent request's recipient
          return {
            id: entry.id,
            username,
            status: 'request',
            type: 'sent',
          };
        })
      );

      const receivedRequests = await Promise.all(
        requested.map(async (entry) => {
          const username = await this.userService.getUsernameById(entry.mainUserId); // Received request's sender
          return {
            id: entry.id,
            username,
            status: 'request',
            type: 'received',
          };
        })
      );

      return [...sentRequests, ...receivedRequests];
    };

    // Get enriched data for friends and blocked users
    const friendsData = await addUsername(friends, true);
    const blockedData = await addUsername(blocked, true);
    const requestData = await addRequestUsernames(requests, requested);

    // Return structured data with enriched username
    return {
      friends: friendsData,
      requests: requestData,
      blocked: blockedData,
    };
  }


  async removeFriend(id: number) {
    // Remove the friend relationship from the database
    const result = await this.friendsRepository.delete(id);

    if (result.affected === 0) {
      throw new Error('Friend not found');
    }

    return { message: 'Friend removed successfully' };
  }
  
}

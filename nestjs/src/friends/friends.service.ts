import { Injectable, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendsEntity } from './entities/friends.entity';
import { UserService } from 'src/user/user.service';

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
  // Add more methods as needed for updating or removing friendships


  // Gives all the friends info needed
  async getFriendsByUserId(userId: number) {
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
  
    // Add the username
		const addUsername = async (entries: FriendsEntity[], isMainUser: boolean) => {
			return Promise.all(entries.map(async (entry) => {
				const userId = isMainUser ? entry.secondUserId : entry.mainUserId;
				const username = await this.userService.getUsernameById(userId);
				return { id: entry.id, username, status: entry.status };
			}));
		};

		return {
			friends: await addUsername(friends, true),
			requests: await addUsername(requests, true),
			requested: await addUsername(requested, false),
			blocked: await addUsername(blocked, true),
		};
  }
  

}

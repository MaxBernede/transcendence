import { Controller, Get, Post, Patch, Param, Body, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get user by ID
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.userService.findOne(userId);
  }

  // Create a new user
  @Post()
  async createUser(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
	console.log('Received body:', { username, email, password });
    if (!username || !email || !password) {
      throw new BadRequestException('Username, email, and password are required');
    }
    return this.userService.create(username, email, password);
  }

  @Patch(':id/update-username')
  async updateUsername(@Param('id') id: string, @Body('username') newUsername: string) {
	console.log('Received ID:', id);
	console.log('Received Username:', newUsername);
  
	// Validate the username
	if (!newUsername || newUsername.trim().length === 0) {
	  throw new BadRequestException('Username cannot be empty');
	}
  
	// Check for unexpected formatting
	if (newUsername.startsWith('User ')) {
	  throw new BadRequestException('Invalid username format');
	}
  
	return this.userService.updateUsername(id, newUsername.trim());
  }

  // Add a friend
  @Post(':userId/add-friend/:friendId')
  async addFriend(@Param('userId') userId: string, @Param('friendId') friendId: string) {
    const parsedUserId = parseInt(userId, 10);
    const parsedFriendId = parseInt(friendId, 10);
    if (isNaN(parsedUserId) || isNaN(parsedFriendId)) {
      throw new BadRequestException('Invalid user or friend ID');
    }
    return this.userService.addFriend(parsedUserId, parsedFriendId);
  }

  // Get all friends
  @Get(':id/friends')
  async getFriends(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.userService.getFriends(userId);
  }
}

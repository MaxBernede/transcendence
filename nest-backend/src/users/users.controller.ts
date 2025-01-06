import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserRequest } from './dto/create-user.request';
import { getFriends, addFriend } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUser() user: any) {
	return user;
  }

  @UseGuards(JwtGuard)
  @Get('me/friends')
  async getMyFriends(@GetUser() user: any) {
	return this.usersService.getMyFriends(user.id);
  }

  @Post('addFriend')
  async addFriend(@Body() body: addFriend) {
    // console.log(body);
    return this.usersService.addFriend(body);
  }

  @Post('getFriend')
  async getFriends(@Body() dto: getFriends) {
    return this.usersService.getFriends(dto);
  }

  @Post()
  async createUser(@Body() body: CreateUserRequest) {
    return this.usersService.createUser(body);
  }

  @Get(':username')
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }
}

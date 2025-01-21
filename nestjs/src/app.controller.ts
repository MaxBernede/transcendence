import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user/user.service';
import { GetUserPayload } from './test.decorator';
import { JwtAuthGuard } from './auth/jwt.guard';
import { TokenPayload } from './auth/dto/token-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


//   @UseGuards(JwtAuthGuard)
//   @Get('api/users/me')
//   async test(@GetUserPayload() payload: TokenPayload, @Req() request: Request) {
//     // console.log(request);
//     console.log('cookies', request.headers['cookie']);
//     console.log('user');
//     const existingUser = await this.userRepository.findOne({
//       where: { username: payload.username },
//     });
//     return existingUser;
//   }

//   @Get('api/users/:id')
//   async getUser(@Param('id') id: string, @Req() request: Request) {
//     console.log('Requested User ID or Username:', id); // Debug log

//     if (id === 'me') {
//       // Resolve "me" to the current user's ID using AuthGuard
//       const userId = request['user']?.sub;
//       if (!userId) {
//         throw new NotFoundException('User not authenticated');
//       }
//       id = userId.toString();
//     }

//     // Determine if the resolved ID is numeric
//     const isNumericId = !isNaN(Number(id));
//     let user;

//     try {
//       // Try fetching the user from the database
//       user = await this.userService.findOne(isNumericId ? +id : id);
//     } catch (error) {
//       console.error('Error fetching user:', error.message);
//       user = null;
//     }

//     if (user) {
//       return user;
//     }

//     console.warn(`User with ID or username "${id}" not found.`);
//     throw new NotFoundException(`User with ID or username "${id}" not found.`);
//   }

//   @Post('api/users/:id/update-username')
//   async updateUsername(
//     @Param('id') id: string,
//     @Body('username') newUsername: string,
//   ) {
//     console.log(`Updating username for user ID ${id} to:`, newUsername);
//     if (!newUsername || newUsername.trim().length === 0) {
//       throw new BadRequestException('Username cannot be empty');
//     }
//     return { id, username: newUsername };
//   }
}

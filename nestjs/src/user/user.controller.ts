import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Put,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
  Req,
  UseGuards,
  Res,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UserService } from './user.service';
import { MatchService } from '../match/match.service';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { Match } from '../match/match.entity';
import { Public } from 'src/decorators/public.decorator';
// import { AuthGuard } from 'src/auth/auth.guard';
import axios from 'axios';
import { Response } from 'express';
import * as fs from 'fs';
import * as cookie from 'cookie';
// import { JwtAuthGuard } from 'src/temp-jwt.guard';
import { GetUserPayload } from 'src/test.decorator';
import { TokenPayload } from 'src/auth/dto/token-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import * as path from 'path';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly matchService: MatchService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

//   @UseGuards(JwtAuthGuard)
//   @Get('me')
//   async test(@GetUserPayload() payload: TokenPayload, @Req() request: Request) {
//     // console.log(request);
//     // console.log('cookies', request.headers['cookie']);
//     // console.log('user');
//     const existingUser = await this.userRepository.findOne({
//       where: { email: payload.email },
//     });
//     return existingUser;
//   }

@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@GetUserPayload() payload: TokenPayload, @Req() request: Request) {
  console.log("Fetching user with ID:", payload.sub);

  const existingUser = await this.userRepository.findOne({
    where: { id: payload.sub }, // Use ID instead of email
  });

  if (!existingUser) {
    throw new UnauthorizedException("User not found.");
  }
  return existingUser;
}


  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updatedData: any,
  ) {
    return this.userService.updateUser(id, updatedData);
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Req() request: Request) {
    console.log('Requested User ID or Username:', id); // Debug log

    if (id === 'me') {
      // Resolve "me" to the current user's ID using AuthGuard
      const userId = request['user']?.sub;
      if (!userId) {
        throw new NotFoundException('User not authenticated');
      }
      id = userId.toString();
    }

    // Determine if the resolved ID is numeric
    const isNumericId = !isNaN(Number(id));
    let user;

    try {
      // Try fetching the user from the database
      user = await this.userService.findOne(isNumericId ? +id : id);
      console.log('user', user);
    } catch (error) {
      console.error('Error fetching user:', error.message);
      user = null;
    }

    if (user) {
      return user;
    }

    console.warn(`User with ID or username "${id}" not found.`);
    throw new NotFoundException(`User with ID or username "${id}" not found.`);
  }

  // AUTH STRATEGY CALL

  // @UseGuards(AuthGuard)
  //   @Get('me')
  //   async getLoggedInUser(@Req() request: any) {
  //     console.log('Request to /me received');
  //     const userId = request.user?.sub;
  //     if (!userId) {
  //       throw new BadRequestException('Unable to determine user from token.');
  //     }
  //     return this.userService.findOneById(userId);
  //   }
  //   @UseGuards(JwtAuthGuard)
  //   @Get('me')
  //   async test(@GetUserPayload() payload: TokenPayload, @Req() request: Request) {
  //     console.log(request);
  //     // console.log('cookies', request.headers['cookie']);
  //     // console.log('user');
  //     const existingUser = await this.userRepository.findOne({
  //       where: { email: payload.email },
  //     });
  //     return existingUser;
  //   }

  //Last part of the login after the 2FA
  async endLogin(@Req() request: any, @Res() res: Response) {
    const userId = request.user?.sub;
    if (!userId) {
      throw new BadRequestException('Unable to determine user from token.');
    }

    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // Set JWT in cookies
    res.setHeader('Set-Cookie', [
      cookie.serialize('jwt', user.tempJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1hr
        path: '/',
      }),
    ]);

    const tempJWT = { tempJWT: null };
    await this.userService.updateUser(user.id.toString(), tempJWT);
    return res.redirect(`http://localhost:3001/user/${user.id}`);
  }

  @Post(':id/upload-avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, callback) => {
          console.log('Writing file to destination:', './uploads/avatars');
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, callback) => {
        console.log('File received:', file.originalname);
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          console.log('Invalid file type:', file.mimetype);
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Fetch user data to check if they already have an avatar
    const user = await this.userService.findOneById(Number(userId));
    if (user && user.avatar) {
      // If the user has an existing avatar, delete the previous file
      const previousAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', user.avatar.replace('http://localhost:3000/uploads/avatars/', ''));
      console.log('Previous avatar path:', previousAvatarPath);
  
      try {
        // Check if the file exists and delete it
        if (fs.existsSync(previousAvatarPath)) {
          fs.unlinkSync(previousAvatarPath);
          console.log(`Previous avatar deleted: ${previousAvatarPath}`);
        }
      } catch (err) {
        console.error('Error deleting previous avatar:', err);
      }
    }
    const avatarUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;
    // console.log('New avatar URL:', avatarUrl);
    // console.log('userId:', userId);
    await this.userService.updateAvatar(userId, avatarUrl);
    return { avatar: avatarUrl };
  }

  @Patch(':id/avatar')
  async updateAvatar(@Param('id') id: string, @Body('avatar') avatar: string) {
    if (!avatar) {
      throw new BadRequestException('Avatar URL is required');
    }

    const updatedUser = await this.userService.updateAvatar(id, avatar);
    return {
      message: 'Avatar updated successfully',
      avatar: updatedUser.avatar,
    };
  }

  @Get('avatar/:username')
  async proxyAvatar(@Param('username') username: string, @Res() res: Response) {
    const url = `https://cdn.intra.42.fr/users/${username}.jpg`;

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      res.setHeader('Content-Type', response.headers['content-type']);
      res.send(response.data);
    } catch (error) {
      console.error(`Error fetching avatar for ${username}:`, error.message);
      res.status(404).send('Image not found');
    }
  }

  @Get('user/:id/match-history')
  async getMatchHistory(@Param('id', ParseIntPipe) id: number) {
    const matchHistory = await this.matchService.findByUser(id);

    if (!matchHistory || matchHistory.length === 0) {
      return []; // Ensure an empty array is returned if no matches exist
    }

    // commented because match database changed
    return [];
    // id: match.id,
    // type: match.type,
    // opponent: match.opponent,
    // result: match.result,
    // score: match.score,
    // description: `${match.type} vs ${match.opponent} - ${match.result} (${match.score})`,
    // date: new Date(match.date).toLocaleDateString('en-GB'),
  }

  @Put(':id/match-history')
  async updateMatchHistory(
    @Param('id', ParseIntPipe) userId: number,
    @Body() matchUpdates: Match[],
  ) {
    return this.matchService.updateMatchHistory(userId, matchUpdates);
  }

}

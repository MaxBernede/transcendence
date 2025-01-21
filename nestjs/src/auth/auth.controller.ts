import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
// import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import axios from 'axios';
import { Response } from 'express';
import * as cookie from 'cookie';
import { TokenPayload } from './dto/token-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  // @Public()
  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // signIn(@Body() signInDto: Record<string, any>) {
  //   return this.authService.signIn(signInDto.username, signInDto.password);
  // }

  //   @Public()
  //   @HttpCode(HttpStatus.OK)
  //   @Post('login')
  //   async login(
  //     @Body() loginDto: { username: string; password: string },
  //     @Res() res: Response,
  //   ) {
  //     const jwt = await this.authService.login(
  //       loginDto.username,
  //       loginDto.password,
  //     );
  //     res.setHeader('Set-Cookie', [
  //       cookie.serialize('jwt', jwt, {
  //         httpOnly: true,
  //         secure: process.env.NODE_ENV === 'production',
  //         sameSite: 'strict',
  //         maxAge: 3600, // 1 hour
  //         path: '/',
  //       }),
  //     ]);
  //     return res.json({ message: 'Login successful' });
  //   }

  //   @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Get()
  getAuth(@Res() res: Response) {
    return this.authService.getAuthToken(res);
  }

  @Public()
  @Get('getJwt')
  getJwt( @Res() res: Response) {
    return this.authService.getJwtToken(res);
  }

  //! FOR DEVELOPMENT PURPOSES ONLY
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({
    description: 'login',
    examples: {
      Example: {
        value: {
          username: 'user', // Only two participants for DM
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async login(@Body() loginDto: { username: string }, @Res() res: Response) {
    try {
      const user = await this.userRepository.findOne({
        where: { username: loginDto.username },
      });

      if (!user) {
        throw new InternalServerErrorException('User not found');
      }
      const payload = typeof TokenPayload;
      const p: TokenPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
      };

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      console.log('JWT_SECRET:', jwtSecret);
      const jwt = this.jwtService.sign(p, { secret: jwtSecret });

      res.setHeader('Set-Cookie', [
        cookie.serialize('jwt', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600, // 1hr
          path: '/',
        }),
      ]);
	  return res.json({ message: 'Login successful' });
    } catch (error) {
      console.error(
        'Failed to fetch JWT:',
        error.response?.data || error.message,
      );
      return res.status(500).json({ message: 'Failed to fetch JWT.' });
    }
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
// import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import axios from 'axios';
import { Response, Request } from 'express';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken'; // Or your preferred JWT library
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { TokenPayload } from './dto/token-payload';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,

    private userService: UserService,
    private jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Public()
  @Get()
  getAuth(@Res() res: Response) {
    return this.authService.getAuthToken(res);
  }

  @Public()
  @Get('getJwt')
  async intraJwt(@Res() res: Response) {
    // check the refresh token
    const code: string = res.req.query.code.toString();
	  if (!code) return res.status(400).json({ message: 'Missing authorization code.' });

    try {
      const jwt = await this.authService.intraJwt(code);
      // there could be an error in parseint ? idk
      const user = await this.userService.findOneById(parseInt(this.authService.getUserIdFromJwt(jwt), 10));
      
      if (user && user.secret_2fa)
        return res.redirect(`http://localhost:3001/2FASetup?id=${user.id}`);

      this.authService.setJwtCookie(res, jwt);
      if (user && user.newUser){
        await this.userService.updateUser(String(user.id), { newUser: false });
        return res.redirect(`http://localhost:3001/user/profileupdate`); //if first login, needs to prompt to change infos :)
      }
      return res.redirect(`http://localhost:3001/user/${this.authService.getUserIdFromJwt(jwt)}`);
    } 
    catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch JWT.' });
    }
  }

  @Post('logout')
  logOut(@Res() res: Response) {
    this.authService.clearCookies(res)
    res.send({ message: 'Logged out successfully' });
  }

  // @UseGuards(AuthGuard)
  @Get('verify')
  async verifyToken(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies['jwt']; // Get JWT from cookies

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    try {
      // Verify the token
      jwt.verify(token, this.configService.get<string>('JWT_SECRET')); // Use your secret or key here
      return res.json({ authenticated: true });
    } catch (error) {
      console.log('Wrong token used to check the jwt');
      return res.status(401).json({ authenticated: false });
    }
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

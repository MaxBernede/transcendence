import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken'; // Or your preferred JWT library
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { TokenPayload } from './dto/token-payload';
import * as cookie from 'cookie';

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

  //   @Public()
  //   @Get('getJwt')
  //   async intraJwt(@Req() req: Request, @Res() res: Response) {
  //     const clientIp =
  //       req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //     console.log('Client IP:', clientIp);
  //     // check the refresh token
  //     const code: string = res.req.query.code.toString();
  //     if (!code)
  //       return res.status(400).json({ message: 'Missing authorization code.' });

  //     try {
  //       const jwt = await this.authService.intraJwt(code);
  //       // there could be an error in parseint ? idk
  //       const user = await this.userService.findOneById(
  //         parseInt(this.authService.getUserIdFromJwt(jwt), 10),
  //       );

  //       if (user && user.secret_2fa)
  //         return res.redirect(`http://localhost:3001/2FASetup?id=${user.id}`);

  //       this.authService.setJwtCookie(res, jwt);
  //       if (user && user.newUser) {
  //         await this.userService.updateUser(String(user.id), { newUser: false });
  //         return res.redirect(`http://localhost:3001/user/profileupdate`); //if first login, needs to prompt to change infos :)
  //       }
  //       return res.redirect(`http://localhost:3001/user/me`);
  //     } catch (error) {
  //       console.error(error);
  //       return res.status(500).json({ message: 'Failed to fetch JWT.' });
  //     }
  //   }
  @Public()
  @Get('getJwt')
  async intraJwt(@Res() res: Response) {
    // Check the refresh token
    const code: string = res.req.query.code?.toString();
    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code.' });
    }

    try {
      const jwt = await this.authService.intraJwt(code);
      const user = await this.userService.findOneById(
        parseInt(this.authService.getUserIdFromJwt(jwt), 10),
      );
	  const frontend_url = this.configService.get<string>('FRONTEND_IP');

      if (user && user.secret_2fa) {
        return res.redirect(
          `${frontend_url}/2FASetup?id=${user.id}`,
        );
      }

      this.authService.setJwtCookie(res, jwt);
      if (user && user.newUser) {
        await this.userService.updateUser(String(user.id), { newUser: false });
		const frontend_url = this.configService.get<string>('FRONTEND_IP');
        return res.redirect(
          `${frontend_url}/user/profileupdate`, // Redirect to client's IP
        );
      }
      return res.redirect(`${frontend_url}/user/me`);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch JWT.' });
    }
  }

  @Post('logout')
  logOut(@Res() res: Response) {
    this.authService.clearCookies(res);
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
      jwt.verify(token, this.configService.getOrThrow<string>('JWT_SECRET')); // Use your secret or key here
      return res.json({ authenticated: true });
    } catch (error) {
      console.log('Wrong token used to check the jwt');
      return res.status(401).json({ authenticated: false });
    }
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login without password' })
  @ApiBody({
    description: 'Login with username only',
    examples: {
      Example: {
        value: {
          username: 'testuser',
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
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
      };

      const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
      const jwt = this.jwtService.sign(payload, { secret: jwtSecret });

      return res.json({ message: 'Login successful', token: jwt });
    } catch (error) {
      console.error('Login error:', error.message);
      return res.status(500).json({ message: 'Login failed' });
    }
  }

  //! FOR DEVELOPMENT PURPOSES ONLY
  @Public()
  @Post('login2')
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
  async login2(@Body() loginDto: { username: string }, @Res() res: Response) {
    console.log('loginDto:', loginDto);
    try {
      const user = await this.userRepository.findOne({
        where: { username: loginDto.username },
      });

      console.log('user:', user);

      if (!user) {
        console.log('Internal Server Error: User not found');
        throw new InternalServerErrorException('User not found');
      }
      const payload = typeof TokenPayload;
      const p: TokenPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
      };

      console.log('p:', p);

      const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
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

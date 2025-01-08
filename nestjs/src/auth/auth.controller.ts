import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import axios from 'axios';
import { Response } from 'express';
import * as cookie from 'cookie';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Public()
  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // signIn(@Body() signInDto: Record<string, any>) {
  //   return this.authService.signIn(signInDto.username, signInDto.password);
  // }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: { username: string; password: string },
    @Res() res: Response,
  ) {
    const jwt = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );
    res.setHeader('Set-Cookie', [
      cookie.serialize('jwt', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1 hour
        path: '/',
      }),
    ]);
    return res.json({ message: 'Login successful' });
  }

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
  getJwt(@Res() res: Response) {
    return this.authService.getJwtToken(res);
  }

  @Public()
  @Post('logout')
  logOut(@Res() res: Response) {
    // Ensure the path is exactly the same as when the cookie was set
    res.clearCookie('jwt', { 
      path: '/',   // Same path as when the cookie was set
      domain: 'localhost', // Optional: Set the same domain if used
      httpOnly: true, // Match the same HttpOnly flag used when setting the cookie
      secure: false, // Ensure it matches the secure flag (use true if on HTTPS)
      sameSite: 'strict', // SameSite attribute should match as well
    });

    // Send a response after clearing the cookie
    res.send({ message: 'Logged out successfully' });
  }
}

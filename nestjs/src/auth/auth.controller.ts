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
import { AuthGuard } from './auth.guard';
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
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }

  @Public()
  @Get()
  getAuth(@Res() res: Response) {
    return this.authService.getAuthToken(res);
  }

  @Public()
  @Get('getJwt')
  async intraJwt(@Res() res: Response) {
    const clientId = this.configService.getOrThrow<string>('INTRA_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>(
      'INTRA_CLIENT_SECRET',
    );
    const redirectUri = 'http://localhost:3000/auth/getJwt';
    const code = res.req.query.code;

    if (!code || !redirectUri) {
      return res
        .status(400)
        .json({ message: 'Missing parameters or environment variables.' });
    }

    try {
      const tokenResponse = await axios.post(
        'https://api.intra.42.fr/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        },
      );

      const accessToken = tokenResponse.data.access_token;

      // Fetch user data from intra API
      const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userInfo = userResponse.data;

      // console.log(userInfo);

      const existingUser = await this.userRepository.findOne({
        where: { intraId: userInfo.id },
      });
      let user;
      if (!existingUser) {
        // I ALREADY EXIST USE NEW USER DATAS
        // Save user to the database
        user = await this.userService.createOrUpdateUser({
          intraId: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
          username: userInfo.login,
          image: userInfo.image,
        });

        console.log(user);
      }

      const userr = await this.userRepository.findOne({
        where: { intraId: userInfo.id },
      });
      if (!userr) {
        throw new InternalServerErrorException();
      }

      // Generate a JWT token with username
      //   const payload = { sub: user.id, email: user.email, username: user.username };
      const payload = typeof TokenPayload;
      const p: TokenPayload = {
        sub: userr.id,
        username: userr.username,
        email: userr.email,
      };
      const jwt = this.jwtService.sign(p);

      // ADD CHECK 2FA HERE, redirect to page with just userid,
      // if validated, redirect to the corect page with the res added. otherwise nothing
      const tempJWT = { tempJWT: jwt };
      await this.userService.updateUser(userr.id.toString(), tempJWT); // store JWT in DBB to add it to res later

      //need to add this check for later to validate the OTP
      // if (userr.secret_2fa){
      //   return res.redirect(`http://localhost:3001/user/${userr.intraId}`);
      // }

      // Set JWT in cookies
      res.setHeader('Set-Cookie', [
        cookie.serialize('jwt', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600, // 1hr
          path: '/',
        }),
      ]);

      // console.log('JWT set in cookies:', jwt);

      // Redirect to the specific user page //! MAX REDIRECT HERE
      return res.redirect(`http://localhost:3001/user/${userr.id}`);
    } catch (error) {
      console.error();
      return res.status(500).json({ message: 'Failed to fetch JWT.' });
    }
  }

  //   @Public()
  //   @Get('getJwt')
  //   getJwt(@Res() res: Response) {
  //     return this.authService.getJwtToken(res);
  //   }

  @Public()
  @Post('logout')
  logOut(@Res() res: Response) {
    // Ensure the path is exactly the same as when the cookie was set
    res.clearCookie('jwt', {
      path: '/', // Same path as when the cookie was set
      domain: 'localhost', // Optional: Set the same domain if used
      httpOnly: true, // Match the same HttpOnly flag used when setting the cookie
      secure: false, // Ensure it matches the secure flag (use true if on HTTPS)
      sameSite: 'strict', // SameSite attribute should match as well
    });

    // Send a response after clearing the cookie
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
}

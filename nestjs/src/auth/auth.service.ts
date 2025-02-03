import {
  Injectable,
  Inject,
  UnauthorizedException,
  Res,
  forwardRef,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cookie from 'cookie';
import { TokenPayload } from './dto/token-payload';
import { use } from 'passport';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private usersService: UserService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Step 1: Redirect to OAuth authorization
  async getAuthToken(@Res() res: Response) {
    const clientId = this.configService.getOrThrow<string>('INTRA_CLIENT_ID');
    const redirectUri = 'http://localhost:3000/auth/getJwt';

    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    res.json({ url: authUrl });
  }

  // Step 2: Exchange code for JWT
  async getJwtToken(@Res() res: Response) {
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

      // IF ALREADY EXIST USE NEW USER DATAS
      // Save user to the database
      const user = await this.usersService.createOrUpdateUser({
        intraId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        username: userInfo.login,
        image: userInfo.image,
      });

      // Generate a JWT token with username
      //   const payload = { sub: user.id, email: user.email, username: user.username };
      const payload = typeof TokenPayload;
      const p: TokenPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
      };
      const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
      console.log('JWT_SECRET:', jwtSecret);
      const jwt = this.jwtService.sign(p, { secret: jwtSecret });

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

      // Redirect to the specific user page
      return res.redirect(`http://localhost:3001/user/${user.id}`);
    } catch (error) {
      console.error(
        'Failed to fetch JWT:',
        error.response?.data || error.message,
      );
      return res.status(500).json({ message: 'Failed to fetch JWT.' });
    }
  }

  // Step 3: Fetch user info (frontend will call this API)
  async getUserInfo(token: string) {
    try {
      const response = await axios.get('https://api.intra.42.fr/v2/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userInfo = response.data;

      // Save user info in the database
      await this.usersService.createOrUpdateUser(userInfo);

      return userInfo;
    } catch (error) {
      console.error(
        'Failed to fetch user info:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  async login(username: string, password: string): Promise<string> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    
    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}

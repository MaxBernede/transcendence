import { Injectable, UnauthorizedException, Res } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cookie from 'cookie';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Step 1: Redirect to OAuth authorization
  async getAuthToken(@Res() res: Response) {
    const clientId = this.configService.get<string>('INTRA_CLIENT_ID');
    const redirectUri = 'http://localhost:3000/auth/getJwt';

    if (!clientId) {
      return res.status(400).json({ message: 'Missing environment variables.' });
    }

    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    res.json({ url: authUrl });
  }

  // Step 2: Exchange code for JWT
  async getJwtToken(@Res() res: Response) {
	const clientId = this.configService.get<string>('INTRA_CLIENT_ID');
	const clientSecret = this.configService.get<string>('INTRA_CLIENT_SECRET');
	const redirectUri = 'http://localhost:3000/auth/getJwt';
	const code = res.req.query.code;
  
	if (!code || !clientId || !clientSecret || !redirectUri) {
	  return res.status(400).json({ message: 'Missing parameters or environment variables.' });
	}
  
	try {
	  const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', {
		grant_type: 'authorization_code',
		client_id: clientId,
		client_secret: clientSecret,
		code,
		redirect_uri: redirectUri,
	  });
  
	  const accessToken = tokenResponse.data.access_token;
  
	  // Fetch user data from intra API
	  const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
		headers: {
		  Authorization: `Bearer ${accessToken}`,
		},
	  });
  
	  const userInfo = userResponse.data;
  
	  // Save user to the database
	  const user = await this.usersService.createOrUpdateUser({
		email: userInfo.email,
		firstName: userInfo.first_name,
		lastName: userInfo.last_name,
		image: userInfo.image,
	  });
  
	  // Generate a JWT token
	  const payload = { sub: user.id, email: user.email };
	  const jwt = this.jwtService.sign(payload);
  
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
  
	  return res.redirect(`http://localhost:3001/user/${user.username}`);
	} catch (error) {
	  console.error('Failed to fetch JWT:', error.response?.data || error.message);
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
      console.error('Failed to fetch user info:', error.response?.data || error.message);
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}

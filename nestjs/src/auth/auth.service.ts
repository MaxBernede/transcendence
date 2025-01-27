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
	  console.log('Auth URL:', authUrl); // Debug for generated URL
	  res.json({ url: authUrl });
	}
  
	// Step 2: Exchange code for JWT
	async getJwtToken(@Res() res: Response) {
		const clientId = this.configService.getOrThrow<string>('INTRA_CLIENT_ID');
		const clientSecret = this.configService.getOrThrow<string>('INTRA_CLIENT_SECRET');
		const redirectUri = 'http://localhost:3000/auth/getJwt';
		const code = res.req.query.code;
	  
		console.log('Received code:', code); // Debug the received authorization code
		if (!code || !redirectUri) {
		  console.error('Missing code or redirectUri in the request.');
		  return res.status(400).json({ message: 'Missing parameters or environment variables.' });
		}
	  
		try {
		  const tokenPayload = {
			grant_type: 'authorization_code',
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		  };
	  
		  console.log('Token payload being sent to 42 API:', tokenPayload); // Debug token payload
	  
		  const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', tokenPayload);
	  
		  console.log('Access token response from 42 API:', tokenResponse.data); // Debug successful response
	  
		  const accessToken = tokenResponse.data.access_token;
	  
		  const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
			headers: {
			  Authorization: `Bearer ${accessToken}`,
			},
		  });
	  
		  console.log('User info fetched from 42 API:', userResponse.data); // Debug user info response
	  
		  const userInfo = userResponse.data;
	  
		  // Save user to the database
		  const user = await this.usersService.createOrUpdateUser({
			intraId: userInfo.id,
			email: userInfo.email,
			firstName: userInfo.first_name,
			lastName: userInfo.last_name,
			username: userInfo.login,
			image: userInfo.image,
		  });
	  
		  console.log('User saved or updated in the database:', user); // Debug database save
	  
		  // Generate a JWT token
		  const payload: TokenPayload = {
			sub: user.id,
			username: user.username,
			email: user.email,
		  };
	  
		  console.log('JWT payload:', payload); // Debug JWT payload
	  
		  const jwtSecret = this.configService.get<string>('JWT_SECRET');
		  console.log('JWT_SECRET being used:', jwtSecret); // Debug JWT secret
	  
		  const jwt = this.jwtService.sign(payload, { secret: jwtSecret });
	  
		  console.log('Generated JWT:', jwt); // Debug JWT creation
	  
		  // Set JWT in cookies
		  res.setHeader('Set-Cookie', [
			cookie.serialize('jwt', jwt, {
			  httpOnly: true,
			  secure: process.env.NODE_ENV === 'production',
			  sameSite: 'strict',
			  maxAge: 3600, // 1 hour
			  path: '/',
			}),
		  ]);
	  
		  console.log('JWT set in cookies successfully.');
	  
		  return res.redirect(`http://localhost:3001/user/${user.id}`);
		} catch (error) {
		  console.error('Error during getJwtToken:', error.message);
	  
		  // Enhanced debugging
		  console.error('Error Response Data:', error.response?.data); // Debug error data
		  console.error('Error Response Status:', error.response?.status); // Debug HTTP status code
		  console.error('Error Response Headers:', error.response?.headers); // Debug headers for clues
		  console.error('Error Request Config:', error.config); // Debug full Axios request config
	  
		  return res.status(500).json({ message: 'Failed to fetch JWT.' });
		}
	  }
  
	// Step 3: Fetch user info (frontend will call this API)
	async getUserInfo(token: string) {
	  try {
		console.log('Fetching user info with token:', token); // Debug for token being used
		const response = await axios.get('https://api.intra.42.fr/v2/me', {
		  headers: {
			Authorization: `Bearer ${token}`,
		  },
		});
  
		console.log('User info fetched from token:', response.data);
  
		const userInfo = response.data;
  
		// Save user info in the database
		const updatedUser = await this.usersService.createOrUpdateUser(userInfo);
  
		console.log('User info saved/updated:', updatedUser);
  
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
	  try {
		console.log('Login attempt with username:', username);
		const user = await this.usersService.findOne(username);
  
		if (!user) {
		  console.error('Invalid username or password for:', username);
		  throw new UnauthorizedException('Invalid username or password');
		}
  
		// Generate JWT token
		const payload = { sub: user.id, email: user.email };
		const jwt = this.jwtService.sign(payload);
  
		console.log('Generated JWT for login:', jwt);
		return jwt;
	  } catch (error) {
		console.error('Error during login:', error.message);
		throw error;
	  }
	}
  }
  
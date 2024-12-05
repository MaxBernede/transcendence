
import { Injectable, UnauthorizedException, Res } from '@nestjs/common';
import { UsersService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
	private usersService: UsersService,
	private jwtService: JwtService,
	private readonly configService: ConfigService
) {}

//First step
async getAuthToken(@Res() res: Response) {
	const clientId = this.configService.get<string>('INTRA_CLIENT_ID');
	const firstRedirectUri = 'http://localhost:3000/auth/getJwt';
	if (!clientId) {
		return res.status(400).json({ message: 'Missing environment variables.' });
	}
	const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${firstRedirectUri}&response_type=code`;
	res.json({ url: authUrl }); // Go to the page where we autorize
	}
	
//Second step
async getJwtToken(@Res() res: Response) {
	const clientId = this.configService.get<string>('INTRA_CLIENT_ID');
	const clientSecret = this.configService.get<string>('INTRA_CLIENT_SECRET');		
	const redirectUri = 'http://localhost:3000/auth/getJwt'
	const code = res.req.query.code;

	if (!code) {
		return res.status(400).json({ message: 'Authorization code is required.' });
	}

	if (!clientId || !clientSecret || !redirectUri) {
		return res.status(400).json({ message: 'Missing environment variables.' });
	}
	console.log('Auth Token :', code);
	try {
		// change Auth token for the JWT
		const response = await axios.post('https://api.intra.42.fr/oauth/token', {
			grant_type: 'authorization_code',
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		});

		const jwt = response.data;
		const access_token = response.data.access_token
		console.log('JWT received :', jwt);
		this.getUserInfosFunction(jwt, res, access_token);
	} catch (error) {
		console.error('Failed to fetch JWT :', error.response?.data || error.message);
		return res.status(500).json({ message: 'Failed to fetch JWT.' });
	}
}

//third step
async getUserInfosFunction(jwt: string, @Res() res: Response, access_token: string) {
	if (!jwt) {
		return res.status(400).json({ message: 'JWT is required.' });
	}

	const auth = `Bearer ${access_token}`;
	console.log(auth);  // access token check
	try {
		const response = await axios.get('https://api.intra.42.fr/v2/me', {
			headers: {
				Authorization: auth,
			}
		});

		console.log('User information received:', response.data);

		// Redirect to frontend with both the JWT and user data in the URL
		return res.redirect(
			`http://localhost:3001/login?token=${jwt}&user=${encodeURIComponent(JSON.stringify(response.data))}`
		);
		} catch (error) {
		console.error('Failed to fetch user info:', error.response?.data || error.message);
		return res.status(500).json({ message: 'Failed to fetch user info.' });
		}
}
















	// async signIn(
	//   username: string,
	//   pass: string
	//   ): Promise< {access_token: string}> {
	//   const user = await this.usersService.findOneByUsername(username); 
	//   if (user?.password !== pass) {
	// 	  throw new UnauthorizedException();
	//   }
	//   const payload = {
	// 	  id: user.id,  // user ID
	// 	  username: user.username,  // username
	// 	  email: user.email,  // email (you can include any other fields as well)
	// 	  wins: user.wins,  // wins
	// 	  loose: user.loose,  // loose
	// 	  ladder_level: user.ladder_level,  // ladder level
	// 	  activity_status: user.activity_status,  // activity status
	// 	};
	
	//   return {
	// 	access_token: await this.jwtService.signAsync(payload),
	//   };
	//   }
}


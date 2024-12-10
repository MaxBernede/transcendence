
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
		// console.log('User information received:', response.data);
		const { 
			email,
			first_name,
			last_name,
			image,
			phone
		 } = response.data;

		const encodedUser = JSON.stringify({ email, first_name, last_name, image, phone });

		// Optionally, encode the data to send it safely in the cookie
		const userData = JSON.stringify({ email, first_name, last_name, image, phone });
		console.log("User infos: ", userData)
		// Set the cookie with user data
		res.setHeader('Set-Cookie', [
			// Cookie JWT
			cookie.serialize('jwt', jwt, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 3600, // 1 heure
				path: '/',
			}),
			// Cookie UserData
			cookie.serialize('userData', encodedUser, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 3600, // 1 heure
				path: '/',
			}),
		]);

		// Redirect to frontend with both the JWT and user data in the URL
		return res.redirect(
			`http://localhost:3001`
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


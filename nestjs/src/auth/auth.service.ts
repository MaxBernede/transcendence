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

  /** Main function called from controller */
	async intraJwt(code: string): Promise<string> {
		const accessToken = await this.getJWTToken(code);
		const userInfo = await this.fetchUserInfo(accessToken);
		const user = await this.findOrCreateUser(userInfo);
		return this.generateAndStoreJWT(user);
	}

	private async getJWTToken(code: string): Promise<string> {
		const clientId = this.configService.getOrThrow<string>('INTRA_CLIENT_ID');
		const clientSecret = this.configService.getOrThrow<string>('INTRA_CLIENT_SECRET');
		const redirectUri = 'http://localhost:3000/auth/getJwt';

		const { data } = await axios.post('https://api.intra.42.fr/oauth/token', {
			grant_type: 'authorization_code',
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		});
		return data.access_token;
	}

	private async fetchUserInfo(accessToken: string) {
		const { data } = await axios.get('https://api.intra.42.fr/v2/me', {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		return data;
	}

  private async findOrCreateUser(userInfo: any) {
    const user = await this.usersService.createOrUpdateUser({
      intraId: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      username: userInfo.login,
      image: userInfo.image,
    });
    return user
	}

	/** Step 4: Generate and store JWT */
	private async generateAndStoreJWT(user: any): Promise<string> {
		const payload: TokenPayload = { sub: user.id, username: user.username, email: user.email };
		const jwt = this.jwtService.sign(payload);
		//await this.userService.updateUser(user.id.toString(), { tempJWT: jwt });
		return jwt;
	}

	setJwtCookie(res: Response, jwt: string) {
		res.setHeader('Set-Cookie', [cookie.serialize('jwt', jwt, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 3600,
			path: '/',
		})]);
	}

  clearCookies(res: Response){
    res.clearCookie('jwt', {
      path: '/', // Same path as when the cookie was set
      domain: 'localhost', // Optional: Set the same domain if used
      httpOnly: true, // Match the same HttpOnly flag used when setting the cookie
      secure: false, // Ensure it matches the secure flag (use true if on HTTPS)
      sameSite: 'strict', // SameSite attribute should match as well
    });
  }

	getUserIdFromJwt(jwt: string): string {
		const decoded = this.jwtService.decode(jwt) as TokenPayload;
		return decoded.sub.toString();
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

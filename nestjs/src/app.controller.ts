import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Req,
  UseGuards,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { GetUserPayload } from './test.decorator';
import { JwtAuthGuard } from './auth/jwt.guard';
import { TokenPayload } from './auth/dto/token-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import axios from 'axios';
import * as cookie from 'cookie';
import { JwtService } from '@nestjs/jwt';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
	private readonly configService: ConfigService,
	private usersService: UserService,
		private jwtService: JwtService,


  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('api/click')
  handleClick(): { message: string } {
    return this.appService.handleButtonClick();
  }

  @Get('auth/getJwt')
  async intraJwt(@Res() res: Response) {
	const clientId = this.configService.getOrThrow<string>('INTRA_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('INTRA_CLIENT_SECRET');
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
			where: { intraId: userInfo.id},
		  });
		let user;
		if (!existingUser) {

			// I ALREADY EXIST USE NEW USER DATAS
			// Save user to the database
			user = await this.usersService.createOrUpdateUser({
			  intraId: userInfo.id,
			  email: userInfo.email,
			  firstName: userInfo.first_name,
			  lastName: userInfo.last_name,
			  username: userInfo.login,
			  image: userInfo.image,
			});
	
			console.log(user)
		}


		const userr = await this.userRepository.findOne({
			where: { intraId: userInfo.id},});
		if (!userr) {
			throw new InternalServerErrorException;
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
  
		console.log('JWT set in cookies:', jwt);
  
		// Redirect to the specific user page
		// return res.redirect(`http://localhost:3001/user/me`);
		return res.redirect(`http://localhost:3002/profile`);
	  } catch (error) {
		console.error(
		  'Failed to fetch JWT:',
		  error.response?.data || error.message,
		);
		return res.status(500).json({ message: 'Failed to fetch JWT.' });
	  }
  }

  @UseGuards(JwtAuthGuard)
  @Get('api/users/me')
  async test(@GetUserPayload() payload: TokenPayload, @Req() request: Request) {
    // console.log(request);
    console.log('cookies', request.headers['cookie']);
    console.log('user');
    const existingUser = await this.userRepository.findOne({
      where: { username: payload.username },
    });
    return existingUser;
  }

  @Get('api/users/:id')
  async getUser(@Param('id') id: string, @Req() request: Request) {
    console.log('Requested User ID or Username:', id); // Debug log

    if (id === 'me') {
      // Resolve "me" to the current user's ID using AuthGuard
      const userId = request['user']?.sub;
      if (!userId) {
        throw new NotFoundException('User not authenticated');
      }
      id = userId.toString();
    }

    // Determine if the resolved ID is numeric
    const isNumericId = !isNaN(Number(id));
    let user;

    try {
      // Try fetching the user from the database
      user = await this.userService.findOne(isNumericId ? +id : id);
    } catch (error) {
      console.error('Error fetching user:', error.message);
      user = null;
    }

    if (user) {
      return user;
    }

    console.warn(`User with ID or username "${id}" not found.`);
    throw new NotFoundException(`User with ID or username "${id}" not found.`);
  }

  @Post('api/users/:id/update-username')
  async updateUsername(
    @Param('id') id: string,
    @Body('username') newUsername: string,
  ) {
    console.log(`Updating username for user ID ${id} to:`, newUsername);
    if (!newUsername || newUsername.trim().length === 0) {
      throw new BadRequestException('Username cannot be empty');
    }
    return { id, username: newUsername };
  }
}

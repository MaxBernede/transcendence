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
import { JwtAuthGuard } from './temp-jwt.guard';
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

  //   @Get('api/users/:id')
  //   async getUser(@Param('id') id: string) {
  // 	console.log("Requested User ID or Username:", id); // Log to verify request handling

  // 	// Validate input
  // 	if (!id) {
  // 	  throw new BadRequestException('Invalid User ID: Must not be empty.');
  // 	}

  // 	const isNumericId = !isNaN(Number(id)); // Determine if the input is numeric
  // 	let user;

  // 	try {
  // 	  // Try fetching the user from the database
  // 	  user = await this.userService.findOne(isNumericId ? +id : id);
  // 	} catch (error) {
  // 	  console.error("Error fetching user:", error.message);
  // 	  user = null; // Set user to null if an error occurs
  // 	}

  // 	// If user exists in the database, return it
  // 	if (user) {
  // 	  return user;
  // 	}

  // 	// If no user found, return a mock response
  // 	console.warn(`User with ID or username "${id}" not found. Returning mock data.`);
  // 	return {
  // 	  username: `${id}`, // Use the input as the username
  // 	  bio: `This is the profile for User ${id}`,
  // 	  avatar: null,
  // 	  wins: 0, // Default stats for mock users
  // 	  losses: 0,
  // 	  ladderLevel: 1,
  // 	};
  //   }

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
	  } 
    catch (error) {
		console.error();
		return res.status(500).json({ message: 'Failed to fetch JWT.' });
	  }
  }

  // This endpoint already exist in the API, conflict
  // changed the check to email because username change
  @UseGuards(JwtAuthGuard)
  @Get('api/users/me')
  async test(@GetUserPayload() payload: TokenPayload, @Req() request: Request) {
    console.log(request);
    // console.log('cookies', request.headers['cookie']);
    // console.log('user');
    const existingUser = await this.userRepository.findOne({
      where: { email: payload.email },
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

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  // canActivate(
  //   context: ExecutionContext,
  // ): boolean | Promise<boolean> | Observable<boolean> {
  //   if (context.getType() !== 'ws') {
  //     console.error('WS Guard used in non-WS context');
  //     return true;
  //   }

  //   console.log('WS Guard used in WS context');

  //   const client: Socket = context.switchToWs().getClient();

  //   WsJwtGuard.validateToken(client);

  //   return true; // Pass the required arguments
  // }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      console.error('WS Guard used in non-WS context');
      return true;
    }
  
    console.log('WS Guard used in WS context');
    const client: Socket = context.switchToWs().getClient();
    return this.validateToken(client); // important: return the result
  }
  

  // // Static validate method
  // static validateToken(client: Socket) {

	// const token = client.handshake?.auth?.token;
	// console.log('Token:', token);


  //   const cookies = client.handshake.headers.cookie; // Raw cookie header
  //   if (!cookies) {
  //     throw new UnauthorizedException('No token provided');
  //   }
  //   const jwt = cookies.split('; ').find((row) => row.startsWith('jwt=')); // Extract JWT cookie
  //   if (!jwt) {
  //     throw new UnauthorizedException('No token provided');
  //   }

  async validateToken(client: Socket): Promise<boolean> {
    const cookieHeader = client.handshake.headers?.cookie;
    if (!cookieHeader) {
      throw new UnauthorizedException('No cookie header found');
    }
  
    const jwtCookie = cookieHeader.split('; ').find((c) => c.startsWith('jwt='));
    if (!jwtCookie) {
      throw new UnauthorizedException('No JWT cookie found');
    }
  
    const token = jwtCookie.split('=')[1];
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
  
      client.data.user = payload; // Attach payload to socket for later use
      return true;
    } catch (err) {
      console.error('JWT verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
  

    // console.log('Token:', jwt);
    // const parsedCookies = cookieParser.JSONCookies(cookies); // Parse cookies
    //TODO: use the secret from the config service / .env file
    // try {
    //   const payload = verify(jwt, 'SECRETT');
    // } catch (error) {
	// 	console.error('JWT verification failed:', error.name, error.message, error.stack);
	//   throw new UnauthorizedException('Invalid or expired token.');
    // }

    // client['user'] = payload; // Attach the decoded user data to the socket

    // return payload; // JWT verification failed


    //might need this for validation for ponggame:

      //     const jwt = cookies.split('; ').find((row) => row.startsWith('jwt='));
      // if (!jwt) {
      //   throw new UnauthorizedException('No token provided');
      // }

      // const token = jwt.split('=')[1]; // Extract actual token value
      // let payload: any;
      // try {
      //   payload = this.jwtService.verify(token, {
      //     secret: this.configService.get<string>('JWT_SECRET'), // from your .env
      //   });
      // } catch (err) {
      //   console.error('JWT verification failed:', err.message);
      //   throw new UnauthorizedException('Invalid or expired token.');
      // }

      // client['user'] = payload; // Store decoded user info on the socket

  }

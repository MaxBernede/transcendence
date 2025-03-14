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

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') {
      console.error('WS Guard used in non-WS context');
      return true;
    }

    console.log('WS Guard used in WS context');

    const client: Socket = context.switchToWs().getClient();

    WsJwtGuard.validateToken(client);

    return true; // Pass the required arguments
  }

  // Static validate method
  static validateToken(client: Socket) {

	const token = client.handshake?.auth?.token;
	console.log('Token:', token);


    const cookies = client.handshake.headers.cookie; // Raw cookie header
    if (!cookies) {
      throw new UnauthorizedException('No token provided');
    }
    const jwt = cookies.split('; ').find((row) => row.startsWith('jwt=')); // Extract JWT cookie
    if (!jwt) {
      throw new UnauthorizedException('No token provided');
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
  }
}

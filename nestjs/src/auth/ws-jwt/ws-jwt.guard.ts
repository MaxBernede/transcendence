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
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      console.error('WS Guard used in non-WS context');
      return true;
    }
  
    // console.log('WS Guard used in WS context');
    const client: Socket = context.switchToWs().getClient();
    return this.validateToken(client); // important: return the result
  }
  
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
  
  }

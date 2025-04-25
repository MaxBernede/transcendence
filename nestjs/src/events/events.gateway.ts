import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
// import { Server } from 'http';
import { Socket, Server } from 'socket.io';
import { TokenPayload } from 'src/auth/dto/token-payload';
import { ConversationsGateway } from 'src/conversations/conversations.gateway';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';

import { EventsType } from "../../common/types/event-type"


// enum EvensType {
//   USER_ADDED_TO_CHAT = 'USER_ADDED_TO_CHAT',
//   USER_REMOVED_FROM_CHAT = 'USER_REMOVED_FROM_CHAT',
// }
@WebSocketGateway({
  // path: '/socket.io',
  namespace: '/events',
  cors: {
	origin: true,
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies to be sent/received if needed
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,


    private readonly jwtService: JwtService,
  ) {}

  async validateClient(client: Socket): Promise<TokenPayload | null> {
    try {
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        console.warn('No cookies provided, disconnecting client.');
        client.disconnect(true);
        return null;
      }

      const tokenCookie = cookies
        .split('; ')
        .find((row) => row.startsWith('jwt='));
      if (!tokenCookie) {
        console.warn('JWT not found in cookies, disconnecting client.');
        client.disconnect(true);
        return null;
      }

      const token = tokenCookie.split('=')[1];

      const payload: TokenPayload = this.jwtService.verify(token);
      // console.log(`Client validated: ${payload.username}`);
      return payload;
    } catch (error) {
      console.error('Error validating client:', error.message);

      if (error.name === 'TokenExpiredError') {
        console.warn('Token has expired, disconnecting client.');
      }

      client.disconnect(true);
      return null;
    }
  }

  @WebSocketServer() wss: Server;

  private userSocketMap: Map<number, string> = new Map(); // Map of userId -> socketId
  private socketUserMap: Map<string, number> = new Map(); // Map of socketId -> userId

  afterInit(server: Server) {
    // console.log('Init socket server');
  }

  async handleDisconnect(client: Socket) {

    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      await this.userRepository.update(userId, { activity_status: false });
    }
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const user: TokenPayload = await this.validateClient(client);
    if (user === null) {
      // console.log(client.id, 'is not valid');

      client.disconnect(true);
      return;
    }
    this.userSocketMap.set(user.sub, client.id);
    this.socketUserMap.set(client.id, user.sub);
    await this.userRepository.update(user.sub, { activity_status: true });
    const updatedUser = await this.userRepository.findOneBy({ id: user.sub });
    // console.log('User updated', updatedUser);
    // console.log(client.id, 'registered for events ', user.sub);

	

    this.wss.emit('serverToClientEvents', 'Hello from events');
  }

  @SubscribeMessage('clientToServer')
  async handleMessage() {}

  sendEventToUser(type: EventsType, userIds: number[], data: any) {
    userIds.forEach((userId) => {
		// console.log("sending event of type", type, "to user", userId)
      const socketId = this.userSocketMap.get(userId);
      if (socketId) {
        this.wss.to(socketId).emit(type, data);
      }
    });
  }
}

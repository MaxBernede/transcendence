import {
  InternalServerErrorException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenPayload } from 'src/auth/dto/token-payload';

import { v4 as uuidv4 } from 'uuid'; // Import the uuid library
import {
  Chat,
  Conversation,
  UserConversation,
} from './entities/conversation.entity';
import { Repository } from 'typeorm';
import { ConversationsService } from './conversations.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.entity';
import { z } from 'zod';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
// import { SocketAuthMiddleware } from 'src/auth/ws.mw';

const PublicUserInfoSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string().url(),
});

type PublicUserInfoDto = z.infer<typeof PublicUserInfoSchema>;

interface clientToServerDto {
  conversationId: string;
  message: string;
}

// Define the interface for a received chat message
export interface serverToClientDto {
  messageId: string; // UUID for the message ID
  message: string;
  timestamp: string;
  conversationId: string;
  senderUser: PublicUserInfoDto;
}

// @UseGuards(SocketAuthGuard)
// @UseGuards(JwtAuthGuard)
@WebSocketGateway({
  // path: '/socket.io',
  namespace: '/chat',
  cors: {
    origin: 'http://localhost:3001', // Allow requests only from this origin (frontend)
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies to be sent/received if needed
  },
})
// @UseGuards(WsJwtGuard)
export class ConversationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(UserConversation)
    private readonly userConversationRepository: Repository<UserConversation>,
    private readonly conversationsService: ConversationsService,

    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer() wss: Server;

  //   validateClient(client: Socket) {
  //     const cookies = client.handshake.headers.cookie;
  //     if (!cookies) {
  //       client.disconnect(true);
  //       console.log('no cookies disconnecting');
  //       throw new UnauthorizedException('No token provided');
  //     }
  //     const token = cookies
  //       .split('; ')
  //       .find((row) => row.startsWith('jwt='))
  //       .split('=')[1];
  //     console.log('Token:', token);
  //     // const payload: TokenPayload = this.jwtService.verify(token);
  //     // client['user'] = payload;
  //     // return true;

  //     try {
  //       const payload: TokenPayload = this.jwtService.verify(token);
  //       client['user'] = payload;
  //     } catch (error) {
  //       console.error('Error validating client:', error);
  //       client.disconnect(true);
  //       throw new UnauthorizedException('Invalid token');
  //     }
  //   }

  async validateClient(client: Socket): Promise<boolean> {
    try {
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        console.warn('No cookies provided, disconnecting client.');
        client.disconnect(true);
        return false;
      }

      const tokenCookie = cookies
        .split('; ')
        .find((row) => row.startsWith('jwt='));
      if (!tokenCookie) {
        console.warn('JWT not found in cookies, disconnecting client.');
        client.disconnect(true);
        return false;
      }

      const token = tokenCookie.split('=')[1];

      const payload: TokenPayload = this.jwtService.verify(token);
      client['user'] = payload;

      console.log(`Client validated: ${payload.username}`);
      return true;
    } catch (error) {
      console.error('Error validating client:', error.message);

      if (error.name === 'TokenExpiredError') {
        console.warn('Token has expired, disconnecting client.');
      }

      client.disconnect(true);
      return false;
    }
  }

  afterInit(server: Server) {
    // console.log('Init socket server');
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const isValid = await this.validateClient(client);
    if (isValid === false) {
      return;
    }
    console.log('Client connected:', client.id);

    const payload: TokenPayload = client['user'];
    // console.log('User:', client['user']);

    //? get all conversations for this user
    const conversations = await this.userConversationRepository.find({
      where: {
        userId: payload.sub,
      },
    });

    conversations.forEach((conversation) => {
      client.join(conversation.conversationId);
      console.log(
        payload.username,
        'joined room:',
        conversation.conversationId,
      );
    });
  }

  // @UseGuards(SocketAuthGuard)
  @SubscribeMessage('chatToServer')
  async handleMessage(
    client: Socket,
    message: clientToServerDto,
  ): Promise<void> {
    const isValid = await this.validateClient(client);
    if (isValid === false) {
      return;
    }

    console.log('Message:', message);
    const user = client['user'];

    const dbUser: PublicUserInfoDto = await this.userRepository.findOne({
      where: { id: user.sub },
      select: ['id', 'username', 'avatar'], // Only select the required fields
    });
    console.log('User:', dbUser);
    try {
      const validatedUser = PublicUserInfoSchema.parse(dbUser);
      console.log('Validated User:', validatedUser);
    } catch (error) {
      console.error('Validation error:', error);
      throw new InternalServerErrorException('Validation error');
    }

    //? check if user AKA me, has access to the conversationId
    try {
      const userConversation = await this.userConversationRepository.findOne({
        where: {
          userId: user.sub,
          conversationId: message.conversationId,
        },
      });
      if (!userConversation) {
        throw new UnauthorizedException(
          'User does not have access to this conversation',
        );
      }
    } catch (error) {
      console.log('User does not have access to this conversation');
      throw new UnauthorizedException(
        'User does not have access to this conversation',
      );
    }

    const newMessage: ChatDto = {
      id: uuidv4(),
      conversationId: message.conversationId,
      userId: user.sub,
      text: message.message,
      edited: false,
      createdAt: undefined, //? will be set by the database
    };

    let savedMessage: Chat;
    try {
      savedMessage = await this.conversationsService.saveChat(newMessage);
    } catch (error) {
      throw new InternalServerErrorException('Error saving chat');
    }
    const res: serverToClientDto = {
      messageId: savedMessage.id,
      message: savedMessage.text,
      timestamp: savedMessage.createdAt.toISOString(),
      conversationId: savedMessage.conversationId,
      senderUser: dbUser,
    };

    this.wss.to(message.conversationId).emit('chatToClient', res);
  }
}

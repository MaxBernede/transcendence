import {
  BadRequestException,
  Inject,
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
import { user } from 'drizzle/schema';
import { plainToInstance } from 'class-transformer';
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
// @UseGuards(WsJwtGuard)
@WebSocketGateway({
  // path: '/socket.io',
  namespace: '/chat',
  cors: {
    origin: 'http://localhost:3001', // Allow requests only from this origin (frontend)
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies to be sent/received if needed
  },
})
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
    // private readonly conversationsService: ConversationsService,
    // @Inject(ConversationsService) // Lazy injection of ConversationsService
    // private readonly conversationsService: ConversationsService,

    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer() wss: Server;
  private userSocketMap: Map<number, string> = new Map(); // Map of userId -> socketId
  private socketIdUserMap: Map<string, number> = new Map(); // Map of socketId -> userId
  private userIdSocketMap: Map<number, Socket> = new Map(); // Map of socketId -> userId

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

  async saveChat(message: ChatDto) {
    try {
      const chat: Chat = plainToInstance(Chat, message);
      const savedChat = this.chatRepository.save(chat);

      // Find the associated conversation
      const conversation = await this.conversationRepository.findOne({
        where: { id: chat.conversationId },
      });

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      conversation.lastActivity = new Date();

      await this.conversationRepository.save(conversation);

      return savedChat;
    } catch (error) {
      console.error('Error saving chat:', error);
      throw new BadRequestException('Error saving chat');
    }
  }

  addUserToRoom(userId: number, conversationId: string) {
    try {
      const socket: Socket = this.userIdSocketMap.get(userId);
      if (socket) {
        socket.join(conversationId);
      }
    } catch (error) {
      console.error('Error adding user to room:', error);
    }
  }

  removeUserFromRoom(userId: number, conversationId: string) {
    try {
      const socket: Socket = this.userIdSocketMap.get(userId);
      if (socket) {
        socket.leave(conversationId);
      }
    } catch (error) {
      console.error('Error removing user from room:', error);
      console.error(userId, conversationId);
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    // userSocketMap.delete(client.id);
    // this.socketIdUserMap.delete(client.id);
    const userId = this.socketIdUserMap.get(client.id);
    this.userSocketMap.delete(userId);
    this.socketIdUserMap.delete(client.id);
    this.userIdSocketMap.delete(userId);
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

    this.userSocketMap.set(payload.sub, client.id);
    this.socketIdUserMap.set(client.id, payload.sub);
    this.userIdSocketMap.set(payload.sub, client);
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
      savedMessage = await this.saveChat(newMessage);
    } catch (error) {
      console.log('Error saving chat');
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

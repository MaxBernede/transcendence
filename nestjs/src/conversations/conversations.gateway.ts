import {
  BadRequestException,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
  forwardRef,
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
import { Conversation } from './entities/conversation.entity';
import { Repository } from 'typeorm';
import { ConversationsService } from './conversations.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.entity';
import { z } from 'zod';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
// import { user } from 'drizzle/schema';
import { plainToInstance } from 'class-transformer';
import { Chat } from './entities/chat.entity';
import { UserConversation } from './entities';
import { Message } from 'common/types/chat-type';
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
  createdAt: string;
  conversationId: string;
  senderUser: PublicUserInfoDto;
  type: 'TEXT' | 'GAME_INVITE';
}

// @UseGuards(SocketAuthGuard)
// @UseGuards(JwtAuthGuard)
// @UseGuards(WsJwtGuard)
@WebSocketGateway({
  // path: '/socket.io',
  namespace: '/chat',
  cors: {
    // origin: 'http://localhost:3001', // Allow requests only from this origin (frontend)
	// origin: '*', // Allow requests from any origin (for testing purposes)
	origin: true,
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
    @Inject(forwardRef(() => ConversationsService)) //? to prevent circular dependency
    private readonly conversationsService: ConversationsService,
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

      // //console.log(`Client validated: ${payload.username}`);
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
    // //console.log('Init socket server');
  }

  async saveChat(message: ChatDto) {
    try {
      // First find the conversation
      const conversation = await this.conversationRepository.findOne({
        where: { id: message.conversationId },
      });

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      // Create the chat with the conversation relation
      const chat = this.chatRepository.create({
        id: message.id,
        text: message.text,
        edited: message.edited,
        conversation: conversation,
        user: { id: message.userId },
      });

      // Save the chat
      const savedChat = await this.chatRepository.save(chat);

      // Update conversation's lastActivity
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
    // //console.log('Client disconnected:', client.id);
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
    // //console.log('Client connected:', client.id);

    const payload: TokenPayload = client['user'];
    // //console.log('User:', client['user']);

    //? get all conversations for this user
    // const conversations = await this.userConversationRepository.find({
    //   where: {
    //     userId: payload.sub,
    //     banned: false,
    //   },
    // });

    const conversations = await this.userConversationRepository.find({
      where: {
        user: { id: payload.sub },
        banned: false,
      },
      relations: ['conversation'],
    });

    // conversations.forEach((conversation) => {
    //   client.join(conversation.conversationId);
    //   //console.log(
    //     payload.username,
    //     'joined room:',
    //     conversation.conversationId,
    //   );
    // });

    conversations.forEach((conversation) => {
      client.join(conversation.conversation.id);
      // //console.log(
      //   payload.username,
      //   'joined room:',
      //   conversation.conversation.id,
      // );
    });

    this.userSocketMap.set(payload.sub, client.id);
    this.socketIdUserMap.set(client.id, payload.sub);
    this.userIdSocketMap.set(payload.sub, client);
  }

  async isUserBannedOrMuted(
    userId: number,
    conversationId: string,
  ): Promise<boolean> {
    const userConversation = await this.userConversationRepository.findOne({
      where: {
        // userId: userId,
        user: { id: userId },
        // conversationId: conversationId,
        conversation: { id: conversationId },
      },
    });
    //? If user isn't in the conversation, consider them banned/unauthorized
    if (!userConversation) {
      throw new NotFoundException('User not found in conversation');
    }
    //? perma ban/mute
    if (userConversation.banned === true) {
      throw new UnauthorizedException(
        'You are permanently banned from this conversation',
      );
    }
    if (userConversation.muted === true) {
      throw new UnauthorizedException('You are muted in this conversation');
    }
    const now = new Date();
    if (userConversation.banEnd !== null) {
      if (userConversation.banEnd < now) {
        userConversation.banEnd = null;
        await this.userConversationRepository.save(userConversation);
        return false;
      } else {
        const timeRemaining = userConversation.banEnd.getTime() - now.getTime();
        throw new UnauthorizedException(
          `You are banned from this conversation for ${timeRemaining} milliseconds`,
        );
      }
    }
    if (userConversation.mutedUntil !== null) {
      if (userConversation.mutedUntil < now) {
        userConversation.mutedUntil = null;
        await this.userConversationRepository.save(userConversation);
        return false;
      } else {
        const timeRemaining =
          userConversation.mutedUntil.getTime() - now.getTime();
        throw new UnauthorizedException(
          `You are muted in this conversation for ${timeRemaining} milliseconds`,
        );
      }
    }
    return false;
  }

  SendChatToConversation(message: Message) {
    this.wss.to(message.conversationId).emit('chatToClient', message);
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

    //console.log('Message:', message);
    const user = client['user'];

    const dbUser: PublicUserInfoDto = await this.userRepository.findOne({
      where: { id: user.sub },
      select: ['id', 'username', 'avatar'], // Only select the required fields
    });
    //console.log('User:', dbUser);
    try {
      const validatedUser = PublicUserInfoSchema.parse(dbUser);
      //console.log('Validated User:', validatedUser);
    } catch (error) {
      console.error('Validation error:', error);
      throw new InternalServerErrorException('Validation error');
    }

    const bannedOrMuted = await this.isUserBannedOrMuted(
      user.sub,
      message.conversationId,
    );
    if (bannedOrMuted) {
      throw new UnauthorizedException(
        'User does not have access to this conversation',
      );
    }

    //? if conversation is a dm, check if user is blocked by the other user
    const conversation = await this.conversationRepository.findOne({
      where: {
        id: message.conversationId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.type === 'DM') {
      const convUsers = await this.userConversationRepository.find({
        where: {
          //   conversationId: message.conversationId,
          conversation: { id: message.conversationId },
        },
        relations: ['user'],
      });

      //   const user1 = convUsers[0].userId;
      const user1 = convUsers[0].user.id;
      //   const user2 = convUsers[1].userId;
      const user2 = convUsers[1].user.id;

      const isBlocked = await this.conversationsService.isUserBlocked(
        user1,
        user2,
      );
      if (isBlocked) {
        throw new UnauthorizedException(
          'You are blocked or blocked by the other user',
        );
      }
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
      //console.log('Error saving chat');
      throw new InternalServerErrorException('Error saving chat');
    }
    const res: serverToClientDto = {
      messageId: savedMessage.id,
      message: savedMessage.text,
      createdAt: savedMessage.createdAt.toString(),
      conversationId: savedMessage.conversation.id,
      senderUser: dbUser,
      type: 'TEXT',
    };

    const mes: Message = {
      id: savedMessage.id,
      conversationId: savedMessage.conversation.id,
      text: savedMessage.text,
      createdAt: savedMessage.createdAt.toString(),
      type: 'TEXT',
      gameInviteData: undefined,
      edited: false,
      senderUser: {
        userId: dbUser.id,
        username: dbUser.username,
        avatar: dbUser.avatar,
      },
    };

    // this.wss.to(message.conversationId).emit('chatToClient', res);
    // this.wss.to(message.conversationId).emit('chatToClient', mes);
    this.SendChatToConversation(mes);
  }

  // New explicit handler for joining a room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    data: { conversationId: string },
  ): Promise<void> {
    const isValid = await this.validateClient(client);
    if (isValid === false) {
      return;
    }

    const user = client['user'];
    //console.log(
    //   `User ${user.username} manually joining room ${data.conversationId}`,
    // );

    // Check if user has access to this conversation
    try {
      const userConversation = await this.userConversationRepository.findOne({
        where: {
          //   userId: user.sub,
          user: { id: user.sub },
          //   conversationId: data.conversationId,
          conversation: { id: data.conversationId },
          banned: false,
        },
      });

      if (!userConversation) {
        //console.log(
        //   `User ${user.username} doesn't have access to conversation ${data.conversationId}`,
        // );
        return;
      }

      // Join the room
      client.join(data.conversationId);
      //console.log(`User ${user.username} joined room: ${data.conversationId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }
}

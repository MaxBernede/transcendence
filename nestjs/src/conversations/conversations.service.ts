import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { TokenPayload } from 'src/auth/dto/token-payload';
import { UserService } from 'src/user/user.service';
import { send } from 'process';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Chat,
  Conversation,
  UserConversation,
} from './entities/conversation.entity';
import { In, QueryFailedError, Repository } from 'typeorm';
import { ChatDto } from './dto/chat.dto';
import { plainToInstance } from 'class-transformer';
import { serverToClientDto } from './conversations.gateway';
import { chat } from 'drizzle/schema';
import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { User } from 'src/user/user.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(UserConversation)
    private readonly userConversationRepository: Repository<UserConversation>,
    private readonly userService: UserService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  async createConversation(
    user: TokenPayload,
    createConversationDto: CreateConversationDto,
  ) {
    console.log('createConversationDto:', createConversationDto);
    // console.log('user:', user);
    const senderUserId = user.sub;

    const receiver = await this.userService.findOne(
      createConversationDto.participants[0], //? index 1 for dm only
    );
    const receiverId = receiver.id;
    console.log('receiver:', receiverId);

    if (createConversationDto.type === 'DM') {
      return this.createConversationDm(
        senderUserId,
        receiverId,
        createConversationDto,
      );
    } else if (createConversationDto.type === 'GROUP') {
      return this.createConversationGroup(
        senderUserId,
        createConversationDto.participants,
        createConversationDto.name,
      );
    }
    throw new BadRequestException('Invalid conversation type');
  }

  async createConversationGroup(
    senderId: number,
    participants: string[],
    groupName: string,
  ) {
    if (participants.length < 1) {
      throw new BadRequestException(
        'Group chat must have at least one participant',
      );
    }

    const participantIds: number[] = [];
    participantIds.push(senderId);
    for (const participant of participants) {
      const p = await this.userService.findOne(participant);
      if (!p) {
        throw new BadRequestException('Participant not found');
      }
      //   participantIds.push(p.id);
      if (!participantIds.includes(p.id)) {
        participantIds.push(p.id);
      }
    }

    const newConversation = this.conversationRepository.create({
      type: 'GROUP',
    });

    if (!groupName) {
      newConversation.name = 'Untitled Group';
    }

    await this.conversationRepository.save(newConversation);

    for (const p of participantIds) {
      const enrty = this.userConversationRepository.create({
        userId: p,
        conversation: newConversation,
      });
      await this.userConversationRepository.save(enrty);
    }

    return newConversation;
  }

  async createConversationDm(
    senderId: number,
    receiverId: number,
    convoDto: CreateConversationDto,
  ) {
    const senderConversations = await this.userConversationRepository.find({
      where: {
        userId: senderId,
        conversation: { type: 'DM' },
      },
      relations: ['conversation', 'conversation.userConversations'],
    });

    const receiverConversations = await this.userConversationRepository.find({
      where: {
        userId: receiverId,
        conversation: { type: 'DM' },
      },
      relations: ['conversation', 'conversation.userConversations'],
    });

    // Find the matching conversation between the sender and receiver
    const matchingConversation = senderConversations.find((userConvo) =>
      userConvo.conversation.userConversations.some(
        (userConv) => userConv.userId === receiverId,
      ),
    );
    // console.log('senderConversation:', senderConversation);
    // console.log('receiverConversation:', receiverConversation);
    console.log('matchingConversation:', matchingConversation);
    if (matchingConversation) {
      throw new BadRequestException('This conversation already exists');
    }
    // return {};
    console.log('No matching conversation found, creating a new one');
    const newConversation = this.conversationRepository.create({
      type: 'DM',
    });

    // Save the new conversation
    await this.conversationRepository.save(newConversation);

    // Step 5: Create the UserConversation entries for both sender and receiver
    const senderConversation = this.userConversationRepository.create({
      userId: senderId,
      conversation: newConversation,
    });

    const receiverConversation = this.userConversationRepository.create({
      userId: receiverId,
      conversation: newConversation,
    });

    // Save the UserConversation entries
    await this.userConversationRepository.save([
      senderConversation,
      receiverConversation,
    ]);

    console.log('The conversation has been successfully created.');
    return newConversation;
  }

  async getConversationsForUser(user: TokenPayload) {
    const userId = user.sub;
    const userConversations = await this.userConversationRepository.find({
      where: { userId },
      relations: ['conversation'],
    });
    return userConversations.map((userConvo) => userConvo.conversation);
  }

  async getChatHistory(user: TokenPayload) {
    const userId = user.sub;

    const conversations = await this.conversationRepository.find({
      relations: [
        'chats', // include the chats in the conversation
        'chats.userId', // load userId (user details)
        'chats.conversationId',
      ],
    });

    console.log('conversations:', conversations);

    // Process the conversations and format the response as needed
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const chatWithUserDetails = await Promise.all(
          conversation.chats.map(async (chat: any) => {
            return {
              text: chat.text,
              createdAt: chat.createdAt,
              senderUser: {
                userId: chat.userId.id, // Now the user is fetched from the database
                username: chat.userId.username,
                avatar: chat.userId.avatar,
              },
            };
          }),
        );

        return {
          conversationId: conversation.id,
          chat: chatWithUserDetails,
        };
      }),
    );

    return formattedConversations;
  }

  async getConversationsWithParticipants(user: TokenPayload) {
    const userId = user.sub;

    // Fetch user conversations with the users related to each conversation, but don't include userConversations in the final result
    const userConversations = await this.userConversationRepository.find({
      where: { userId },
      relations: [
        'conversation',
        'conversation.userConversations',
        'conversation.userConversations.user',
        'conversation.chats',
      ],
    });

    // Map through the userConversations and return only conversationId and participants (user objects)
    return userConversations.map((userConvo) => {

      const conversationId = userConvo.conversation.id;
      const type = userConvo.conversation.type;
	  const name = userConvo.conversation.name;

      const participants = userConvo.conversation.userConversations
        .map((uc) => uc.user) // Extract users
        .filter((participant) => participant.id !== userId); // Exclude the current user

      const chats = userConvo.conversation.chats.map((chat) => ({
        id: chat.id,
        userId: chat.userId,
        text: chat.text,
        edited: chat.edited,
        createdAt: chat.createdAt,
      }));

      // const res: serverToClientDto = {
      //   messageId:
      //   message:
      //   sender: 'server',
      //   timestamp:
      //   conversationId:
      //   senderUser:
      // };

      return {
        conversationId, // Only return the conversationId
        type,
		name,
        participants, // Return the filtered user objects (participants)
      };
    });
  }

  saveChat(message: ChatDto) {
    try {
      const chat: Chat = plainToInstance(Chat, message);
      const savedChat = this.chatRepository.save(chat);
      return savedChat;
    } catch (error) {
      console.error('Error saving chat:', error);
      throw new BadRequestException('Error saving chat');
    }
  }

  //   async getParticipants(conversationId: string, user: TokenPayload) {
  //     try {
  //       const userConversations = await this.userConversationRepository.find({
  //         where: { conversationId },
  //         relations: ['user'],
  //       });

  //       //? Check if the user is part of the conversation
  //       const userInConversation = userConversations.some(
  //         (userConvo) => userConvo.user.id === user.sub,
  //       );

  //       if (!userInConversation) {
  //         throw new UnauthorizedException(
  //           'You are not authorized to view participants of this conversation',
  //         );
  //       }

  //       return userConversations.map((userConvo) => userConvo.user);
  //     } catch (error) {
  //       if (error.code === '22P02') {
  //         console.error(
  //           'Error fetching participants:',
  //           error.message,
  //           error.code,
  //         );
  //         throw new BadRequestException('Invalid conversation ID');
  //       }
  //       console.error('Error fetching participants:', error.message, error.code);
  //       throw new BadRequestException('Error fetching participants');
  //     }
  //   }

  async getParticipants(conversationId: string, user: TokenPayload) {
    try {
      // Fetch user-conversations along with the related 'conversation' to get the type
      const userConversations = await this.userConversationRepository.find({
        where: { conversationId },
        relations: ['user', 'conversation'], // Include 'conversation' to get the type
      });

      // Check if the user is part of the conversation
      const userInConversation = userConversations.some(
        (userConvo) => userConvo.user.id === user.sub,
      );

      if (!userInConversation) {
        throw new UnauthorizedException(
          'You are not authorized to view participants of this conversation',
        );
      }

      // Retrieve conversation type (assuming it's a field in the Conversation entity)
      const conversationType =
        userConversations[0]?.conversation?.type || 'unknown'; // Handle missing type safely

      return {
        conversationType, // Include the conversation type in the response
        participants: userConversations.map((userConvo) => userConvo.user),
      };
    } catch (error) {
      // Handle database-specific errors
      if (error.code === '22P02') {
        console.error(
          'Error fetching participants: Invalid conversation ID',
          error.message,
        );
        throw new BadRequestException('Invalid conversation ID');
      }

      // General error handling
      console.error('Error fetching participants:', error.message);
      throw new BadRequestException('Error fetching participants');
    }
  }
}

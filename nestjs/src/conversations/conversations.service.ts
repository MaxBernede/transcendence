import {
  BadRequestException,
  forwardRef,
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
import {
  ConversationsGateway,
  serverToClientDto,
} from './conversations.gateway';
import { chat } from 'drizzle/schema';
import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { User } from 'src/user/user.entity';
import { EventsGateway } from 'src/events/events.gateway';
import { last } from 'rxjs';

import { z } from 'zod';

//TODO: fix this shit, monorepo?
import {
  AddConversationToListSchema,
  EventsType,
  RemoveConversationFromListSchema,
  RemoveParticipantFromConversationSchema,
} from '../../common/types/event-type';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(UserConversation)
    private readonly userConversationRepository: Repository<UserConversation>,
    private readonly userService: UserService,

    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,

    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,

    private readonly eventsGateway: EventsGateway,

    private readonly conversationsGateway: ConversationsGateway,
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

    console.log('groupName:', groupName);

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

    // if (!groupName) {
    //   newConversation.name = 'Untitled Group';
    // }
    if (groupName) {
      newConversation.name = groupName;
    }

    await this.conversationRepository.save(newConversation);

    for (const p of participantIds) {
      const enrty = this.userConversationRepository.create({
        userId: p,
        conversation: newConversation,
        role: p === senderId ? 'OWNER' : 'MEMBER',
      });
      await this.userConversationRepository.save(enrty);
    }

    console.log(participantIds);

    const d: z.infer<typeof AddConversationToListSchema> = {
      conversationId: newConversation.id,
    };
    //? send event to the removed user to remove the conversation from their list
    this.eventsGateway.sendEventToUser(
      EventsType.ADD_CONVERSATION_TO_LIST,
      participantIds,
      d,
    );

    for (const p of participantIds) {
      this.conversationsGateway.addUserToRoom(p, newConversation.id);
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
      //   throw new BadRequestException('This conversation already exists');
      return matchingConversation.conversation;
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

    // Get all the conversations that the user is part of
    const userConversations = await this.userConversationRepository.find({
      where: { userId },
      relations: ['conversation'],
    });

    const conversationIds = userConversations.map(
      (userConv) => userConv.conversationId,
    );

    // Now, find only the conversations the user is part of
    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) }, // Filter conversations based on user participation
      relations: [
        'chats', // include the chats in the conversation
        'chats.userId', // load userId (user details)
        'chats.conversationId',
      ],
    });

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
        lastActivity: userConvo.conversation.lastActivity,
      };
    });
  }

  async getConversationById(user: TokenPayload, conversationId: string) {
    const userId = user.sub;

    // Fetch the conversation by ID, including participants and chats
    const userConversation = await this.userConversationRepository.findOne({
      where: {
        userId,
        conversation: { id: conversationId },
      },
      relations: [
        'conversation',
        'conversation.userConversations',
        'conversation.userConversations.user',
        'conversation.chats',
      ],
    });

    if (!userConversation) {
      throw new Error(
        'Conversation not found or user is not part of this conversation',
      );
    }

    const conversation = userConversation.conversation;

    // Filter participants to exclude the current user
    const participants = conversation.userConversations
      .map((uc) => uc.user)
      .filter((participant) => participant.id !== userId);

    const chats = conversation.chats.map((chat) => ({
      id: chat.id,
      userId: chat.userId,
      text: chat.text,
      edited: chat.edited,
      createdAt: chat.createdAt,
    }));

    return {
      conversationId: conversation.id,
      type: conversation.type,
      name: conversation.name,
      participants,
      chats,
      lastActivity: conversation.lastActivity,
    };
  }

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
        conversationType,
        participants: userConversations.map((userConvo) => ({
          ...userConvo.user, // Spread the full user object
          group_role: userConvo.role, // Add role separately
        })),
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

  async removeUserFromConversation(
    conversationId: string,
    userId: string,
    user: TokenPayload,
  ) {
    try {
      const { participants } = await this.getParticipants(conversationId, user);
      //   console.log('participants:', participants);

      const currentUser = participants.find((p) => p.id === user.sub);
      if (!currentUser) {
        throw new UnauthorizedException(
          'You are not a participant in this conversation',
        );
      }

      // Check if currentUser has the 'role' property
      if ('group_role' in currentUser) {
        if (currentUser.group_role !== 'OWNER') {
          throw new UnauthorizedException(
            'You are not the owner of the conversation',
          );
        }
      } else {
        throw new UnauthorizedException(
          'User does not have a valid role in this conversation',
        );
      }

      const targetUser = participants.find(
        (p) => p.id === parseInt(userId, 10),
      );
      if (!targetUser) {
        throw new BadRequestException('User not found in the conversation');
      }

      //   console.log('currentUser:', currentUser.group_role);
      if (currentUser.group_role !== 'OWNER') {
        throw new UnauthorizedException(
          'You are not the owner of the conversation',
        );
      }

      if (currentUser.id === targetUser.id) {
        throw new BadRequestException('You cannot remove yourself');
      }

      //TODO: actuall remove the user from the conversation
      const result = await this.userConversationRepository.delete({
        conversationId,
        userId: targetUser.id,
      });
      console.log('User removed from conversation:', targetUser.username);

      //   const participantIds = participants.map((p) => p.id);
      //   this.eventsGateway.sendEventToUser(
      //     EventsType.USER_REMOVED_FROM_CHAT,
      //     participantIds,
      //     {
      //       message: 'You have been removed from the conversation',
      //       id: conversationId,
      //       userId: targetUser.id,
      //     },
      //   );

      //   const d: z.infer<typeof RemoveConversationFromListSchema> = {
      //     data: { conversationId },
      //   };

      const d: z.infer<typeof RemoveConversationFromListSchema> = {
        conversationId: conversationId,
      };
      //? send event to the removed user to remove the conversation from their list
      this.eventsGateway.sendEventToUser(
        EventsType.REMOVE_CONVERSATION_FROM_LIST,
        [targetUser.id],
        d,
      );

      //? send event to all participants to update the chat participants list
      const dd: z.infer<typeof RemoveParticipantFromConversationSchema> = {
        conversationId: conversationId,
        userId: targetUser.id,
      };
      const remainingParticipants = participants.filter(
        (p) => p.id !== targetUser.id,
      );
      this.eventsGateway.sendEventToUser(
        EventsType.REMOVE_PARTICIPANT_FROM_CONVERSATION,
        remainingParticipants.map((p) => p.id),
        dd,
      );

      this.conversationsGateway.removeUserFromRoom(
        targetUser.id,
        conversationId,
      );

      return { message: 'User removed from conversation' };

      //? Check if the user is the owner of the conversation
    } catch (error) {
      console.log('Error fetching participants:', error);
      throw new BadRequestException('Error fetching participants');
    }
  }
}

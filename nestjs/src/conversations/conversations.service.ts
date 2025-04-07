import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChangePasswordDto,
  CreateConversationDto,
  JoinConversationDto,
  LeaveConversationDto,
  UpdateMemberRoleDto,
} from './dto/create-conversation.dto';
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
// import { chat } from 'drizzle/schema';
import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { User } from 'src/user/user.entity';
import { EventsGateway } from 'src/events/events.gateway';
import { last, NotFoundError } from 'rxjs';

import * as argon2 from 'argon2';

import { z } from 'zod';

//TODO: fix this shit, monorepo?
import {
  AddConversationToListSchema,
  AddParticipantToConversationSchema,
  EventsType,
  GroupUserStatusAction,
  GroupUserStatusUpdateSchema,
  RemoveConversationFromListSchema,
  RemoveParticipantFromConversationSchema,
  UpdateMemberRoleSchema,
} from '../../common/types/event-type';
import { checkPrimeSync } from 'crypto';
import { ucs2 } from 'punycode';
import { argon2d } from 'argon2';
import { Console } from 'console';
import { FriendsEntity } from '@/friends/entities/friends.entity';

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

    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationsGateway: ConversationsGateway,

    @InjectRepository(FriendsEntity)
    private readonly friendsRepository: Repository<FriendsEntity>,
  ) {}

  async leaveConversation(user: TokenPayload, conversationId: string) {
    console.log(user.sub, 'leaving conversation', conversationId);

    //? if conversation is a dm, return error
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.type === 'DM') {
      console.log('Cannot leave a DM conversation');
      throw new BadRequestException('Cannot leave a DM conversation');
    }

    //? if user is the owner and groupsize > 1, return error

    const participants = await this.userConversationRepository.find({
      where: {
        // conversationId,
        conversation: { id: conversationId },
        banned: false,
      },
      relations: ['user'],
    });
    // const me = participants.find((p) => p.userId === user.sub);
    // const me = participants.find((p) => p.userId === user.sub);
    const me = participants.find((p) => p.user.id === user.sub);
    if (!me) {
      throw new BadRequestException('User not part of the conversation');
    }
    console.log('me:', me);
    console.log('participants:', participants);
    if (participants.length === 1) {
      //? remove user from userConversations
      await this.userConversationRepository.delete({
        // userId: user.sub,
        user: { id: user.sub },
        // conversationId,
        conversation: { id: conversationId },
      });

      const data: z.infer<typeof RemoveConversationFromListSchema> = {
        conversationId: conversationId,
      };
      this.eventsGateway.sendEventToUser(
        EventsType.REMOVE_CONVERSATION_FROM_LIST,
        [user.sub],
        data,
      );
      this.conversationsGateway.removeUserFromRoom(user.sub, conversationId);
      return { message: 'User removed from conversation' };
    }

    if (me.role === 'OWNER') {
      throw new BadRequestException(
        'Cannot leave a group conversation as the owner',
      );
    }

    await this.userConversationRepository.delete({
      user: { id: user.sub },
      conversation: { id: conversationId },
    });

    const data: z.infer<typeof RemoveConversationFromListSchema> = {
      conversationId: conversationId,
    };
    this.eventsGateway.sendEventToUser(
      EventsType.REMOVE_CONVERSATION_FROM_LIST,
      [user.sub],
      data,
    );

    //? send event to all participants to update the chat participants list
    const userIds = participants.map((p) => p.user.id);
    const eventData: z.infer<typeof RemoveParticipantFromConversationSchema> = {
      conversationId,
      userId: user.sub,
    };
    this.eventsGateway.sendEventToUser(
      EventsType.REMOVE_PARTICIPANT_FROM_CONVERSATION,
      userIds,
      eventData,
    );

    this.conversationsGateway.removeUserFromRoom(user.sub, conversationId);

    return { message: 'User removed from conversation' };
  }

  async changePassword(
    user: TokenPayload,
    changePasswordDto: ChangePasswordDto,
  ) {
    const { id, password } = changePasswordDto;

    console.log('changePasswordDto:', changePasswordDto);

    const conversation = await this.conversationRepository.findOneBy({
      id,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('This conversation is not a group');
    }

    //? check if user is owner of the conversation
    const userConversation = await this.userConversationRepository.findOne({
      where: {
        user: { id: user.sub },
        conversation: { id: id },
      },
      relations: ['user', 'conversation'],
    });

    if (!userConversation) {
      throw new UnauthorizedException('You are not part of this conversation');
    }

    if (userConversation.role !== 'OWNER') {
      throw new UnauthorizedException(
        'You are not the owner of this conversation',
      );
    }

    const hashedPassword = await argon2.hash(password);
    if (!hashedPassword) {
      throw new BadRequestException('Error hashing the password');
    }

    if (password === '') {
      conversation.password = null;
      conversation.isPrivate = false;
      await this.conversationRepository.save(conversation);
      return { message: 'Password changed successfully' };
    }

    conversation.password = hashedPassword;

    await this.conversationRepository.save(conversation);

    return { message: 'Password changed successfully' };
  }

  async joinConversation(
    user: TokenPayload,
    conversationId: JoinConversationDto,
  ) {
    console.log('joinConversation:', user.username, conversationId.id);
    console.log('joinConversation:', conversationId);
    //? Check if conversation exist
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId.id,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.isPrivate) {
      throw new UnauthorizedException('This conversation is private');
    }

    if (conversation.password) {
      if (!conversationId.password) {
        throw new BadRequestException('Password is required');
      }
      console.log('conversation.password:', conversation.password);
      const passwordMatch = await argon2.verify(
        conversation.password,
        conversationId.password,
      );
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    //? check if user is not banned
    const userConversation = await this.userConversationRepository.findOne({
      where: {
        user: { id: user.sub },
        conversation: { id: conversationId.id },
      },
      relations: ['user', 'conversation'],
    });

    //? user is not part of the conversation, add user to the conversation
    if (!userConversation) {
      const entry = this.userConversationRepository.create({
        user: { id: user.sub },
        conversation: { id: conversationId.id },
      });
      //? send event to all participants to update the chat participants list
      const users = await this.userConversationRepository.find({
        where: { conversation: { id: conversationId.id } },
        relations: ['user'],
      });
      const userIds = users.map((user) => user.user.id);
      console.log('users:', userIds);

      if (users.length === 0) {
        entry.role = 'OWNER';
      }

      await this.userConversationRepository.save(entry);

      {
        const eventData: z.infer<typeof AddConversationToListSchema> = {
          conversationId: conversationId.id,
        };
        this.eventsGateway.sendEventToUser(
          EventsType.ADD_CONVERSATION_TO_LIST,
          [user.sub],
          eventData,
        );
      }

      {
        const eventData: z.infer<typeof AddParticipantToConversationSchema> = {
          conversationId: conversationId.id,
          userId: user.sub,
        };
        this.eventsGateway.sendEventToUser(
          EventsType.ADD_PARTICIPANT_TO_CONVERSATION,
          userIds,
          eventData,
        );
      }
      {
        const eventData: z.infer<typeof GroupUserStatusUpdateSchema> = {
          conversationId: conversationId.id,
          userId: user.sub,
          action: GroupUserStatusAction.JOIN,
        };

        this.eventsGateway.sendEventToUser(
          EventsType.GROUP_USER_STATUS_UPDATED,
          userIds,
          eventData,
        );
      }
      return {
        message: 'User added to conversation',
        conversationId: conversationId.id,
      };
    }

    //? check if the user is banned, if banned check if the ban has expired
    if (userConversation.banned) {
      if (userConversation.banEnd) {
        if (new Date() > userConversation.banEnd) {
          userConversation.banned = false;
          userConversation.banEnd = null;
          await this.userConversationRepository.save(userConversation);
          return {
            message: 'User added to conversation',
            conversationId: conversationId.id,
          };
        }
      }
      throw new UnauthorizedException('You are banned from this conversation');
    }

    return {
      message: 'User already part of the conversation',
      conversationId: conversationId.id,
    };
  }

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
        createConversationDto.password,
        createConversationDto.isPrivate,
      );
    }
    throw new BadRequestException('Invalid conversation type');
  }

  async createConversationGroup(
    senderId: number,
    participants: string[],
    groupName: string,
    password: string | null,
    isPrivate: boolean,
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

    let passwordHash: string | null = null;
    if (password) {
      try {
        passwordHash = await argon2.hash(password);
        console.log('passwordHash:', passwordHash);
      } catch (error) {
        throw new BadRequestException('Error hashing the password');
      }
    }

    const newConversation = this.conversationRepository.create({
      type: 'GROUP',
      password: passwordHash,
      isPrivate: isPrivate,
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
        // userId: p,
        user: { id: p },
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
        user: { id: senderId },
        conversation: { type: 'DM' },
      },
      relations: ['conversation', 'conversation.userConversations'],
    });

    const receiverConversations = await this.userConversationRepository.find({
      where: {
        user: { id: receiverId },
        conversation: { type: 'DM' },
      },
      relations: ['conversation', 'conversation.userConversations'],
    });

    // Find the matching conversation between the sender and receiver
    const matchingConversation = senderConversations.find((userConvo) =>
      userConvo.conversation.userConversations.some(
        (userConv) => userConv.user.id === receiverId,
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
      user: { id: senderId },
      conversation: newConversation,
    });

    const receiverConversation = this.userConversationRepository.create({
      user: { id: receiverId },
      conversation: newConversation,
    });

    // Save the UserConversation entries
    await this.userConversationRepository.save([
      senderConversation,
      receiverConversation,
    ]);

    // Add users to the conversation room
    this.conversationsGateway.addUserToRoom(senderId, newConversation.id);
    this.conversationsGateway.addUserToRoom(receiverId, newConversation.id);

    // Send event to both users to add the conversation to their list
    const eventData: z.infer<typeof AddConversationToListSchema> = {
      conversationId: newConversation.id,
    };
    this.eventsGateway.sendEventToUser(
      EventsType.ADD_CONVERSATION_TO_LIST,
      [senderId, receiverId],
      eventData,
    );

    console.log('The conversation has been successfully created.');
    return newConversation;
  }

  async getConversationsForUser(user: TokenPayload) {
    const userId = user.sub;
    const userConversations = await this.userConversationRepository.find({
      where: { user: { id: userId } },
      relations: ['conversation'],
    });
    return userConversations.map((userConvo) => userConvo.conversation);
  }

  async getChatHistory(user: TokenPayload) {
    const userId = user.sub;

    // Get all the conversations that the user is part of and check their banned status
    const userConversations = await this.userConversationRepository.find({
      where: { user: { id: userId } },
      relations: ['conversation'],
    });

    // Filter out conversations where the user is banned
    const validUserConversations = userConversations.filter(
      (userConv) => userConv.banned === false,
    );

    const conversationIds = validUserConversations.map(
      (userConv) => userConv.conversation.id,
    );

    // Now, find only the conversations the user is part of and not banned
    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) }, // Filter conversations based on user participation
      relations: [
        'chats', // Include the chats in the conversation
        'chats.userId', // Load userId (user details)
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

  //   async getChatHistory(user: TokenPayload) {
  //     const userId = user.sub;

  //     // Get all the conversations that the user is part of
  //     const userConversations = await this.userConversationRepository.find({
  //       where: { userId },
  //       relations: ['conversation'],
  //     });

  //     const conversationIds = userConversations.map(
  //       (userConv) => userConv.conversationId,
  //     );

  //     // Now, find only the conversations the user is part of
  //     const conversations = await this.conversationRepository.find({
  //       where: { id: In(conversationIds) }, // Filter conversations based on user participation
  //       relations: [
  //         'chats', // include the chats in the conversation
  //         'chats.userId', // load userId (user details)
  //         'chats.conversationId',
  //       ],
  //     });

  //     // Process the conversations and format the response as needed
  //     const formattedConversations = await Promise.all(
  //       conversations.map(async (conversation) => {
  //         const chatWithUserDetails = await Promise.all(
  //           conversation.chats.map(async (chat: any) => {
  //             return {
  //               text: chat.text,
  //               createdAt: chat.createdAt,
  //               senderUser: {
  //                 userId: chat.userId.id, // Now the user is fetched from the database
  //                 username: chat.userId.username,
  //                 avatar: chat.userId.avatar,
  //               },
  //             };
  //           }),
  //         );

  //         return {
  //           conversationId: conversation.id,
  //           chat: chatWithUserDetails,
  //         };
  //       }),
  //     );

  //     return formattedConversations;
  //   }

  async getConversationsWithParticipants(user: TokenPayload) {
    const userId = user.sub;

    // Fetch user conversations with the users related to each conversation, including the banned status
    const userConversations = await this.userConversationRepository.find({
      where: { user: { id: userId } },
      relations: [
        'conversation',
        'conversation.userConversations',
        'conversation.userConversations.user', // Include the user info
        'conversation.chats',
      ],
    });

    // Map through the userConversations and return only conversationId and participants (user objects)
    return userConversations
      .map((userConvo) => {
        const conversationId = userConvo.conversation.id;
        const type = userConvo.conversation.type;
        const name = userConvo.conversation.name;

        // Get participants excluding the current user and those who are banned
        const participants = userConvo.conversation.userConversations
          .filter((uc) => uc.user.id !== userId && uc.banned === false) // Exclude the current user and banned users
          .map((uc) => uc.user); // Extract the user from userConversation

        // Check if the current user (me) is banned in the conversation
        const isCurrentUserBanned =
          userConvo.conversation.userConversations.some(
            (uc) => uc.user.id === userId && uc.banned === true,
          );

        // If the current user is banned, don't return the conversation
        if (isCurrentUserBanned) {
          return null; // This will effectively remove the conversation from the final result
        }

        const chats = userConvo.conversation.chats.map((chat) => ({
          id: chat.id,
          userId: chat.userId,
          text: chat.text,
          edited: chat.edited,
          createdAt: chat.createdAt,
        }));

        return {
          conversationId,
          type,
          name,
          participants, // Return the filtered user objects (participants)
          lastActivity: userConvo.conversation.lastActivity,
        };
      })
      .filter((convo) => convo !== null); // Filter out null conversations (where the user was banned)
  }

  //   async getConversationsWithParticipants(user: TokenPayload) {
  //     const userId = user.sub;

  //     // Fetch user conversations with the users related to each conversation, but don't include userConversations in the final result
  //     const userConversations = await this.userConversationRepository.find({
  //       where: { userId },
  //       relations: [
  //         'conversation',
  //         'conversation.userConversations',
  //         'conversation.userConversations.user',
  //         'conversation.chats',
  //       ],
  //     });

  //     // Map through the userConversations and return only conversationId and participants (user objects)
  //     return userConversations.map((userConvo) => {
  //       const conversationId = userConvo.conversation.id;
  //       const type = userConvo.conversation.type;
  //       const name = userConvo.conversation.name;

  //       const participants = userConvo.conversation.userConversations
  //         .map((uc) => uc.user) // Extract users
  //         .filter((participant) => participant.id !== userId); // Exclude the current user

  //       const chats = userConvo.conversation.chats.map((chat) => ({
  //         id: chat.id,
  //         userId: chat.userId,
  //         text: chat.text,
  //         edited: chat.edited,
  //         createdAt: chat.createdAt,
  //       }));

  //       return {
  //         conversationId, // Only return the conversationId
  //         type,
  //         name,
  //         participants, // Return the filtered user objects (participants)
  //         lastActivity: userConvo.conversation.lastActivity,
  //       };
  //     });
  //   }

  async getConversationById(user: TokenPayload, conversationId: string) {
    const userId = user.sub;
    // Fetch the conversation by ID, including participants and chats
    const userConversation = await this.userConversationRepository.findOne({
      where: {
        user: { id: userId },
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

    const bannedStatus = userConversation.banned;
    console.log('status:', userConversation);
    if (bannedStatus) {
      throw new UnauthorizedException('You are banned from this conversation');
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
        where: { conversation: { id: conversationId } },
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
          banned: userConvo.banned,
          muted_untill: userConvo.mutedUntil,
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

  //   async removeUserFromConversation(
  //     conversationId: string,
  //     userId: string,
  //     user: TokenPayload,
  //   ) {
  //     try {
  //       const { participants } = await this.getParticipants(conversationId, user);
  //       //   console.log('participants:', participants);

  //       const currentUser = participants.find((p) => p.id === user.sub);
  //       if (!currentUser) {
  //         throw new UnauthorizedException(
  //           'You are not a participant in this conversation',
  //         );
  //       }

  //       // Check if currentUser has the 'role' property
  //       if ('group_role' in currentUser) {
  //         if (currentUser.group_role !== 'OWNER') {
  //           throw new UnauthorizedException(
  //             'You are not the owner of the conversation',
  //           );
  //         }
  //       } else {
  //         throw new UnauthorizedException(
  //           'User does not have a valid role in this conversation',
  //         );
  //       }

  //       const targetUser = participants.find(
  //         (p) => p.id === parseInt(userId, 10),
  //       );
  //       if (!targetUser) {
  //         throw new BadRequestException('User not found in the conversation');
  //       }

  //       //   console.log('currentUser:', currentUser.group_role);
  //       if (currentUser.group_role !== 'OWNER') {
  //         throw new UnauthorizedException(
  //           'You are not the owner of the conversation',
  //         );
  //       }

  //       if (currentUser.id === targetUser.id) {
  //         throw new BadRequestException('You cannot remove yourself');
  //       }

  //       //TODO: actuall remove the user from the conversation
  //       const result = await this.userConversationRepository.delete({
  //         conversationId,
  //         userId: targetUser.id,
  //       });
  //       console.log('User removed from conversation:', targetUser.username);

  //       //   const participantIds = participants.map((p) => p.id);
  //       //   this.eventsGateway.sendEventToUser(
  //       //     EventsType.USER_REMOVED_FROM_CHAT,
  //       //     participantIds,
  //       //     {
  //       //       message: 'You have been removed from the conversation',
  //       //       id: conversationId,
  //       //       userId: targetUser.id,
  //       //     },
  //       //   );

  //       //   const d: z.infer<typeof RemoveConversationFromListSchema> = {
  //       //     data: { conversationId },
  //       //   };

  //       const d: z.infer<typeof RemoveConversationFromListSchema> = {
  //         conversationId: conversationId,
  //       };
  //       //? send event to the removed user to remove the conversation from their list
  //       this.eventsGateway.sendEventToUser(
  //         EventsType.REMOVE_CONVERSATION_FROM_LIST,
  //         [targetUser.id],
  //         d,
  //       );

  //       //? send event to all participants to update the chat participants list
  //       const dd: z.infer<typeof RemoveParticipantFromConversationSchema> = {
  //         conversationId: conversationId,
  //         userId: targetUser.id,
  //       };
  //       const remainingParticipants = participants.filter(
  //         (p) => p.id !== targetUser.id,
  //       );
  //       this.eventsGateway.sendEventToUser(
  //         EventsType.REMOVE_PARTICIPANT_FROM_CONVERSATION,
  //         remainingParticipants.map((p) => p.id),
  //         dd,
  //       );

  //       this.conversationsGateway.removeUserFromRoom(
  //         targetUser.id,
  //         conversationId,
  //       );

  //       return { message: 'User removed from conversation' };

  //       //? Check if the user is the owner of the conversation
  //     } catch (error) {
  //       console.log('Error fetching participants:', error);
  //       throw new BadRequestException('Error fetching participants');
  //     }
  //   }

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
      //   if ('group_role' in currentUser) {
      //     if (currentUser.group_role !== 'OWNER') {
      //       throw new UnauthorizedException(
      //         'You are not the owner of the conversation',
      //       );
      //     }
      //   } else {
      //     throw new UnauthorizedException(
      //       'User does not have a valid role in this conversation',
      //     );
      //   }

      if (!currentUser.group_role) {
        throw new UnauthorizedException(
          'You are not the owner of the conversation',
        );
      }

      const targetUser = participants.find(
        (p) => p.id === parseInt(userId, 10),
      );
      if (!targetUser) {
        throw new BadRequestException('User not found in the conversation');
      }

      //   console.log('currentUser:', currentUser.group_role);
      //   if (currentUser.group_role !== 'OWNER') {
      // 	  throw new UnauthorizedException(
      // 		  'You are not the owner of the conversation',
      // 		);
      // 	}

      if (currentUser.id === targetUser.id) {
        throw new BadRequestException('You cannot remove yourself');
      }

      const targetUserRole = targetUser.group_role;
      const currentUserRole = currentUser.group_role;
      if (currentUserRole === 'MEMBER') {
        throw new UnauthorizedException(
          'You are not authorized to remove this user',
        );
      }
      if (targetUserRole === currentUserRole) {
        throw new UnauthorizedException(
          'You are not authorized to remove this user',
        );
      }
      if (targetUserRole === 'OWNER') {
        throw new UnauthorizedException(
          'You cannot remove the owner of the conversation',
        );
      }

      //TODO: actuall remove the user from the conversation
      const result = await this.userConversationRepository.delete({
        conversation: { id: conversationId },
        user: { id: targetUser.id },
      });
      console.log('User removed from conversation:', targetUser.username);

      //? send event to the removed user to remove the conversation from their list
      //   const removeFromListEvent: z.infer<typeof RemoveConversationFromListSchema> = {
      //     conversationId: conversationId,
      //   };
      //   this.eventsGateway.sendEventToUser(
      //     EventsType.REMOVE_CONVERSATION_FROM_LIST,
      //     [targetUser.id],
      //     removeFromListEvent,
      //   );
      //? send event to the removed user to remove the conversation from their list

      {
        const eventData: z.infer<typeof GroupUserStatusUpdateSchema> = {
          conversationId: conversationId,
          userId: targetUser.id,
          action: GroupUserStatusAction.KICK,
          duration: 0,
          reason: 'Kicked by: ' + user.username,
        };

        this.eventsGateway.sendEventToUser(
          EventsType.GROUP_USER_STATUS_UPDATED,
          // userIds,
          [targetUser.id],
          eventData,
        );
        this.conversationsGateway.removeUserFromRoom(
          targetUser.id,
          conversationId,
        );
      }

      //? send event to all participants to update the chat participants list
      const removeParticipantEvent: z.infer<
        typeof RemoveParticipantFromConversationSchema
      > = {
        conversationId: conversationId,
        userId: targetUser.id,
      };
      const remainingParticipants = participants.filter(
        (p) => p.id !== targetUser.id,
      );
      this.eventsGateway.sendEventToUser(
        EventsType.REMOVE_PARTICIPANT_FROM_CONVERSATION,
        remainingParticipants.map((p) => p.id),
        removeParticipantEvent,
      );

      return { message: 'User removed from conversation' };

      //? Check if the user is the owner of the conversation
    } catch (error) {
      console.log('Error fetching participants:', error);
      throw new BadRequestException('Error fetching participants');
    }
  }

  async updateRole(user: TokenPayload, updateMember: UpdateMemberRoleDto) {
    //? get role of the current user
    const myRole = await this.userConversationRepository.findOne({
      where: {
        user: { id: user.sub },
        conversation: { id: updateMember.conversationId },
      },
      relations: ['user', 'conversation'],
    });

    if (!myRole) {
      throw new UnauthorizedException('You are not part of this conversation');
    }

    if (myRole.role !== 'OWNER') {
      throw new UnauthorizedException(
        'You are not the owner of this conversation',
      );
    }

    const targetUser = await this.userConversationRepository.findOne({
      where: {
        user: { id: updateMember.memberId },
        conversation: { id: updateMember.conversationId },
      },
    });

    if (!targetUser) {
      throw new BadRequestException('User not found in the conversation');
    }

    targetUser.role = updateMember.role;

    try {
      await this.userConversationRepository.save(targetUser);
      //? send event to all participants to update the chat participants list
      const participants = await this.userConversationRepository.find({
        where: { conversation: { id: updateMember.conversationId } },
        relations: ['user'],
      });
      const userIds = participants.map((p) => p.user.id);

      const eventData: z.infer<typeof UpdateMemberRoleSchema> = {
        conversationId: updateMember.conversationId,
        memberId: updateMember.memberId,
        role: updateMember.role,
      };
      this.eventsGateway.sendEventToUser(
        EventsType.GROUP_ROLE_UPDATED,
        userIds,
        eventData,
      );
      if (updateMember.role === 'OWNER') {
        await this.userConversationRepository.update(
          {
            user: { id: user.sub },
            conversation: { id: updateMember.conversationId },
          },
          { role: 'ADMIN' },
        );

        //? send event to all participants to update the chat participants list
        const eventData: z.infer<typeof UpdateMemberRoleSchema> = {
          conversationId: updateMember.conversationId,
          memberId: user.sub,
          role: 'ADMIN',
        };
        this.eventsGateway.sendEventToUser(
          EventsType.GROUP_ROLE_UPDATED,
          userIds,
          eventData,
        );
      }

      return { message: 'Role updated successfully' };

      //   console.log('myRole:', myRole);
    } catch (error) {
      console.log('error:', error);
      throw new BadRequestException('Error updating role');
    }
  }

  async sendEventToGroupParticipants(
    conversationId: string,
    obj: z.infer<typeof GroupUserStatusUpdateSchema>,
    eventsType: EventsType,
  ) {
    const participants = await this.userConversationRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['user', 'conversation'],
    });
    if (!participants) {
      throw new BadRequestException(
        'No participants found in the conversation',
      );
    }
    const userIds: number[] = participants.map((p) => p.user.id);
    console.log('userIds:', userIds);
    this.eventsGateway.sendEventToUser(eventsType, userIds, obj);
  }

  async banUserFromConversation(
    conversationId: string,
    userId: number,
    user: TokenPayload,
  ) {
    console.log('banUserFromConversation:', conversationId, userId, user);

    ///? check if the conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    //? check if both users are part of the conversation
    const users = await this.userConversationRepository.find({
      where: {
        conversation: { id: conversationId },
        user: { id: In([userId, user.sub]) },
      },
      relations: ['user', 'conversation'],
    });

    if (users.length !== 2) {
      throw new BadRequestException('Users are not part of the conversation');
    }

    const senderUser = users.find((u) => u.user.id === user.sub);
    const targetUser = users.find((u) => u.user.id === userId);

    if (
      senderUser.role === 'OWNER' ||
      (senderUser.role === 'ADMIN' && targetUser.role !== 'OWNER')
    ) {
      targetUser.banned = true;
      targetUser.role = 'MEMBER';
      // targetUser.banEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
      try {
        await this.userConversationRepository.save(targetUser);
      } catch (error) {
        console.log('error:', error);
        throw new BadRequestException('Error banning user');
      }
      const eventData: z.infer<typeof GroupUserStatusUpdateSchema> = {
        conversationId: conversationId,
        userId: targetUser.user.id,
        action: GroupUserStatusAction.BAN,
        duration: 0,
        reason: 'Banned by: ' + user.username,
      };
      //   const userIds = users.map((u) => u.userId);
      this.sendEventToGroupParticipants(
        conversationId,
        eventData,
        EventsType.GROUP_USER_STATUS_UPDATED,
      );

      //   {
      //     const eventData: z.infer<typeof RemoveConversationFromListSchema> = {
      //       conversationId: conversationId,
      //     };
      //     this.eventsGateway.sendEventToUser(
      //       EventsType.REMOVE_CONVERSATION_FROM_LIST,
      //       [targetUser.userId],
      //       eventData,
      //     );
      //   }

      return { message: 'User banned successfully' };
    } else {
      throw new UnauthorizedException(
        'You are not authorized to ban this user',
      );
    }

    // console.log('users:', users);
  }

  async unbanUserFromConversation(
    conversationId: string,
    userId: number,
    user: TokenPayload,
  ) {
    console.log('banUserFromConversation:', conversationId, userId, user);

    ///? check if the conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    //? check if both users are part of the conversation
    const users = await this.userConversationRepository.find({
      where: {
        conversation: { id: conversationId },
        user: { id: In([userId, user.sub]) },
      },
      relations: ['user', 'conversation'],
    });

    if (users.length !== 2) {
      throw new BadRequestException('Users are not part of the conversation');
    }

    const senderUser = users.find((u) => u.user.id === user.sub);
    const targetUser = users.find((u) => u.user.id === userId);

    if (senderUser.role === 'OWNER' || senderUser.role === 'ADMIN') {
      targetUser.banned = false;
      //   targetUser.role = 'MEMBER';
      // targetUser.banEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
      try {
        // await this.userConversationRepository.save(targetUser);
        await this.userConversationRepository.delete(targetUser.id);
      } catch (error) {
        console.log('error:', error);
        throw new BadRequestException('Error unbanning user');
      }
      const eventData: z.infer<typeof GroupUserStatusUpdateSchema> = {
        conversationId: conversationId,
        userId: targetUser.user.id,
        action: GroupUserStatusAction.UNBAN,
        duration: 0,
        reason: 'Unbanned by: ' + user.username,
      };
      this.sendEventToGroupParticipants(
        conversationId,
        eventData,
        EventsType.GROUP_USER_STATUS_UPDATED,
      );
      //   {
      //     const eventData: z.infer<
      //       typeof RemoveParticipantFromConversationSchema
      //     > = {
      //       conversationId: conversationId,
      //       userId: targetUser.userId,
      //     };
      //     const participants = await this.userConversationRepository.find({
      //       where: { conversationId },
      //     });
      //     const userIds = participants.map((u) => u.userId);
      //     this.eventsGateway.sendEventToUser(
      //       EventsType.REMOVE_PARTICIPANT_FROM_CONVERSATION,
      //       userIds,
      //       eventData,
      //     );
      //   }
      return { message: 'User unbanned successfully' };
    } else {
      throw new UnauthorizedException(
        'You are not authorized to ban this user',
      );
    }
  }

  //? checks if the user has the authority to perform an action
  async hasAuthority(user: number, target: number, convId: string) {
    //? 1: check if both users are part of the conversation
    const users: any = await this.userConversationRepository.find({
      where: {
        conversation: { id: convId },
        user: { id: In([user, target]) },
      },
      relations: ['user', 'conversation'],
    });
    // console.log('users:', users.length);
    if (users.length !== 2) {
      return false;
    }
    //? 2: check if user has higher role than target user
    const senderUser = users.find((u) => u.user.id === user);
    const targetUser = users.find((u) => u.user.id === target);
    if (senderUser.role === 'OWNER') {
      return true;
    } else if (senderUser.role === 'ADMIN' && targetUser.role === 'MEMBER') {
      return true;
    }
    return false;
  }

  async banUser(user: TokenPayload, data: any) {
    console.log('banUser:', user, data);
    const valid = await this.hasAuthority(
      user.sub,
      data.id,
      data.conversationId,
    );
    if (!valid) {
      throw new UnauthorizedException(
        'You are not authorized to mute this user',
      );
    }
    console.log('valid:', valid);

    const userConv = await this.userConversationRepository.findOne({
      where: {
        user: { id: data.id },
        conversation: { id: data.conversationId },
      },
      relations: ['user', 'conversation'],
    });
    if (!userConv) {
      throw new NotFoundException('User not found in the conversation');
    }

    const eventData: z.infer<typeof GroupUserStatusUpdateSchema> = {
      conversationId: data.conversationId,
      userId: data.id,
      action: GroupUserStatusAction.BAN,
      duration: 0,
      reason: 'Banned by: ' + user.username,
    };

    //? if minutes, hours and days are all 0, then mute indefinitely
    if (data.minutes === 0 && data.hours === 0 && data.days === 0) {
      userConv.banned = true;
      console.log('userConv:', userConv);
      await this.userConversationRepository.save(userConv);
      this.sendEventToGroupParticipants(
        data.conversationId,
        eventData,
        EventsType.GROUP_USER_STATUS_UPDATED,
      );

      this.conversationsGateway.removeUserFromRoom(
        userConv.user.id,
        userConv.conversation.id,
      );

      return { message: 'User banned successfully' };
    }

    //? if minutes, hours and days are not all 0, calcualte end date
    const now = new Date();
    const end = new Date();

    const msPerMinute = 60 * 1000;
    const msPerHour = 60 * msPerMinute;
    const msPerDay = 24 * msPerHour;

    const totalMs =
      now.getTime() +
      data.minutes * msPerMinute +
      data.hours * msPerHour +
      data.days * msPerDay;

    end.setTime(totalMs);
    userConv.banEnd = end;
    userConv.banned = true;
    await this.userConversationRepository.save(userConv);

    // const eventData: z.infer<typeof GroupUserStatusUpdateSchema> = {
    //   conversationId: data.conversationId,
    //   userId: data.id,
    //   action: GroupUserStatusAction.BAN,
    //   duration: 0,
    //   reason: 'Banned by: ' + user.username,
    // };
    // //   const userIds = users.map((u) => u.userId);
    this.sendEventToGroupParticipants(
      data.conversationId,
      eventData,
      EventsType.GROUP_USER_STATUS_UPDATED,
    );

    this.conversationsGateway.removeUserFromRoom(
      userConv.user.id,
      userConv.conversation.id,
    );

    return { message: 'User banned successfully' };
  }

  async muteUser(user: TokenPayload, data: any) {
    console.log('muteUser:', user, data);
    const valid = await this.hasAuthority(
      user.sub,
      data.id,
      data.conversationId,
    );
    if (!valid) {
      throw new UnauthorizedException(
        'You are not authorized to mute this user',
      );
    }
    console.log('valid:', valid);

    const userConv = await this.userConversationRepository.findOne({
      where: {
        user: { id: data.id },
        conversation: { id: data.conversationId },
      },
      relations: ['user', 'conversation'],
    });
    if (!userConv) {
      throw new NotFoundException('User not found in the conversation');
    }

    //? if minutes, hours and days are all 0, then mute indefinitely
    if (data.minutes === 0 && data.hours === 0 && data.days === 0) {
      userConv.muted = true;
      console.log('userConv:', userConv);
      await this.userConversationRepository.save(userConv);
      return { message: 'User muted successfully' };
    }

    //? if minutes, hours and days are not all 0, calcualte end date
    const now = new Date();
    const end = new Date();

    const msPerMinute = 60 * 1000;
    const msPerHour = 60 * msPerMinute;
    const msPerDay = 24 * msPerHour;

    const totalMs =
      now.getTime() +
      data.minutes * msPerMinute +
      data.hours * msPerHour +
      data.days * msPerDay;

    end.setTime(totalMs);

    userConv.mutedUntil = end;
    await this.userConversationRepository.save(userConv);

    return { message: 'User muted successfully' };
  }

  async unmuteUserFromConversation(
    conversationId: string,
    targetUser: number,
    user: TokenPayload,
  ) {
    const valid = await this.hasAuthority(user.sub, targetUser, conversationId);
    if (!valid) {
      throw new UnauthorizedException(
        'You are not authorized to unmute this user',
      );
    }

    const userConv = await this.userConversationRepository.findOne({
      where: {
        user: { id: targetUser },
        conversation: { id: conversationId },
      },
      relations: ['user', 'conversation'],
    });

    if (!userConv) {
      throw new NotFoundException('User not found in the conversation');
    }

    userConv.muted = false;
    userConv.mutedUntil = null;
    await this.userConversationRepository.save(userConv);

    return { message: 'User unmuted successfully' };
  }

  async isUserBlocked(user: number, target: number) {
    const existingRelationship = await this.friendsRepository.findOne({
      where: [
        { mainUserId: user, secondUserId: target },
        { mainUserId: target, secondUserId: user },
      ],
    });
    if (existingRelationship) {
      return existingRelationship.status === 'blocked';
    }
    return false;
  }
}

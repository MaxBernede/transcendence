import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { GetUserPayload } from 'src/test.decorator';
import { TokenPayload } from 'src/auth/dto/token-payload';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Conversation } from './entities/conversation.entity';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({
    description: 'The details to create a new conversation',
    examples: {
      'DM Example': {
        value: {
          type: 'DM',
          participants: ['recipient_username'], // Only two participants for DM
        },
      },
      'Group Example': {
        value: {
          name: 'Project Discussion', // Group chat requires a name
          type: 'GROUP',
          participants: ['user1', 'user2', 'user3'], // Multiple participants for Group
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The conversation has been successfully created.',
    type: Conversation, // Specify the response type
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(
    @GetUserPayload() user: TokenPayload,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    console.log('createConversationDto:', createConversationDto);
    return this.conversationsService.createConversation(
      user,
      createConversationDto,
    );
  }

  @Get()
  async getMyConversationsWithParticipants(
    @GetUserPayload() user: TokenPayload,
  ) {
    console.log('user:', user);
    const temp: any =
      await this.conversationsService.getConversationsWithParticipants(user);
    // console.log('temp:', temp[0].chats);
    return temp;
  }

  @Get('history')
  async getMyChatHistory(@GetUserPayload() user: TokenPayload) {
    console.log('/conversations/history');
    const temp = await this.conversationsService.getChatHistory(user);
    return temp;
  }

  @Get(':id')
  async getConversationById(
    @GetUserPayload() user: TokenPayload,
    @Param('id') id: string,
  ) {
    return this.conversationsService.getConversationById(user, id);
  }

  @Get(':id/participants')
  async getParticipants(
    @Param('id') id: string,
    @GetUserPayload() user: TokenPayload,
  ) {
    return this.conversationsService.getParticipants(id, user);
  }

  @Delete(':conversationId/users/:userId')
  async removeUserFromConversation(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
    @GetUserPayload() user: TokenPayload,
  ) {
    return this.conversationsService.removeUserFromConversation(
      conversationId,
      userId,
      user,
    );
  }
}

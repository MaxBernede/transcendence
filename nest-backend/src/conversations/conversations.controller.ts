import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { ConversationsService } from './conversations.service';
import { GetUser } from 'src/auth/decorator';
import { JWTPayloadDto } from 'src/auth/dto';
import { CreateConversationDmDto, SendConversationMessageDto } from './dto';
import { Send } from 'express';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtGuard)
  @Get() // GET	List all conversations for the user.
  getConversations(@GetUser() user: any) {
    return this.conversationsService.getConversations(user);
  }

  @UseGuards(JwtGuard)
  @Post('dm') // Create a private or group conversation.
  createConversationDm(
    @GetUser() user: any,
    @Body() dto: CreateConversationDmDto,
  ) {
    return this.conversationsService.createConversationDm(user, dto);
  }

  @UseGuards(JwtGuard)
  @Post(':id/messages') // Create a private or group conversation.
  sendConversationMessage(
    @GetUser() user: any,
    @Param('id') convoId: string,
    @Body() dto: SendConversationMessageDto,
  ) {
    return this.conversationsService.sendConversationMessage(
      user,
      convoId,
      dto,
    );
  }
}

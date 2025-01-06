import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONENCTION } from 'src/database/database-connection';
import * as schema from 'schema/schema';
import { JWTPayloadDto } from 'src/auth/dto';
import { CreateConversationDmDto, SendConversationMessageDto } from './dto';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(DATABASE_CONENCTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createConversationDm(user: any, dto: CreateConversationDmDto) {
    // return 'Conversation created';
    console.log(user);
    // console.log(dto);
    const userOther = await this.db.query.users.findFirst({
      where: (users) => eq(users.username, dto.username),
    });
    if (!userOther) {
      throw new NotFoundException('User not found');
    }
    // console.log(u);
    const userId1 = user.id;
    const userId2 = userOther.id;

    console.log(userId1, userId2);

    // Step 1: Check if the conversation already exists
    const existingConversation =
      await this.db.query.usersConversations.findMany({
        where: (usersConversations) => eq(usersConversations.userId, userId1),
      });

    // console.log(existingConversation);

    const conversationIds = existingConversation.map(
      (convo) => convo.conversationId,
    );

    if (conversationIds.length > 0) {
      const conversation = await this.db.query.conversations.findFirst({
        where: (conversations) =>
          eq(conversations.type, 'private') &&
          //   conversationIds.includes(conversations.id), // Match the conversation
          inArray(conversations.id, conversationIds),
      });

      //   return 'asd';

      //   console.log(conversation);

      if (conversation) {
        const isUser2InConversation =
          await this.db.query.usersConversations.findFirst({
            where: (usersConversations) =>
              eq(usersConversations.conversationId, conversation.id) &&
              eq(usersConversations.userId, userId2),
          });

        if (isUser2InConversation) {
          console.log('conversation exists');
          return conversation; // Return the existing conversation if user2 is part of it
        }
      }
    }

    // Step 6: If no existing conversation, create a new one
    const newConversation = await this.db
      .insert(schema.conversations)
      .values({
        type: 'private',
      })
      .returning(); // Get the new conversation details

    // Step 7: Add both users to the new conversation
    await this.db.insert(schema.usersConversations).values([
      { userId: userId1, conversationId: newConversation[0].id },
      { userId: userId2, conversationId: newConversation[0].id },
    ]);

    return newConversation;
  }

  async getConversations(user: any) {
    console.log(user);
  }

  async sendConversationMessage(
    user: typeof schema.users.$inferSelect,
    convoId: string,
    dto: SendConversationMessageDto,
  ) {
    console.log(user);
    console.log(convoId);
    console.log(dto);

    // return;

    type NewMessage = typeof schema.messages.$inferInsert;
    const insertMessage = async (message: NewMessage) => {
      return this.db.insert(schema.messages).values(message).returning();
    };
    const newMessage: NewMessage = {
      conversationId: parseInt(convoId, 10),
      senderId: user.id,
      content: dto.message,
    };

    try {
      const insertedMessage = await insertMessage(newMessage);
      console.log(insertedMessage);
      return { success: true, message: 'Message sent successfully' };
    } catch (e) {
      if (e.code === '23503') {
        throw new NotFoundException('Conversation not found');
      }
      console.log(e);
    }
  }
}

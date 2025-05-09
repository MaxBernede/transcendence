import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { Match } from './match/match.entity';
import { Conversation } from './conversations/entities/conversation.entity';
import { FriendsEntity } from './friends/entities/friends.entity';
import { Chat } from './conversations/entities/chat.entity';
import { UserConversation } from './conversations/entities';
import { ChatGameInvite } from './conversations/entities/chat-game-invite.entity';


// console.log('--- ENV VARIABLES ---');
// console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
// console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT);
// console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
// console.log('POSTGRES_PASSWORD:', typeof process.env.POSTGRES_PASSWORD, process.env.POSTGRES_PASSWORD);
// console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
// console.log('----------------------');

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: +process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [User, Match, Chat, Conversation, UserConversation, FriendsEntity, ChatGameInvite],
  synchronize: true, // For development only
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
};
